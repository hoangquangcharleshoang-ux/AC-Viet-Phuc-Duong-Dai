/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2A.5: Per-Model Circuit Breaker with Single-Canary Lock & State Machine
 */

import { ClassifiedGeminiError, ROUTER_CONFIG } from './geminiErrorClassifier';
import { loadQuotaBlocks, saveQuotaBlock, isModelQuotaBlocked } from './quotaQuarantine';

export type CircuitState = 'AVAILABLE' | 'COOLDOWN' | 'HALF_OPEN';

export interface ModelRuntimeState {
  status: CircuitState;
  cooldownUntil: number;
  consecutiveFailures: number;
  lastFailureReason?: string;
  lastFailureAt?: number;
  lastSuccessAt?: number;
  providerRetryAfterSeconds?: number;
  canaryInFlight: boolean;
  disabledForRuntime?: boolean;
}

export type ModelPermit =
  | 'AVAILABLE'
  | 'EXECUTE_CANARY'
  | 'SKIP_COOLDOWN'
  | 'SKIP_CANARY_BUSY'
  | 'SKIP_DISABLED';

export class ModelCircuitBreaker {
  private states = new Map<string, ModelRuntimeState>();

  /**
   * Get or initialize model runtime state
   */
  public getState(modelId: string): ModelRuntimeState {
    let state = this.states.get(modelId);
    if (!state) {
      state = {
        status: 'AVAILABLE',
        cooldownUntil: 0,
        consecutiveFailures: 0,
        canaryInFlight: false,
        disabledForRuntime: false
      };
      this.states.set(modelId, state);
    }
    return state;
  }

  /**
   * Evaluate whether a model is eligible to execute
   */
  public evaluateModel(modelId: string, now: number = Date.now()): ModelPermit {
    const state = this.getState(modelId);

    if (state.disabledForRuntime) {
      return 'SKIP_DISABLED';
    }

    // Check persistent quota quarantine first
    if (isModelQuotaBlocked(modelId)) {
      const blocks = loadQuotaBlocks();
      const rec = blocks[modelId];
      if (rec && now < rec.blockedUntil) {
        state.status = 'COOLDOWN';
        state.cooldownUntil = rec.blockedUntil;
        return 'SKIP_COOLDOWN';
      }
    }

    // Check Cooldown expiration
    if (state.status === 'COOLDOWN') {
      if (now < state.cooldownUntil) {
        return 'SKIP_COOLDOWN';
      }
      // Cooldown expired -> transition to HALF_OPEN
      state.status = 'HALF_OPEN';
    }

    // HALF_OPEN: Single canary guard (Requirement 3 & 17)
    if (state.status === 'HALF_OPEN') {
      if (state.canaryInFlight) {
        // Another concurrent request is already probing; do not wait, bypass to fallback!
        return 'SKIP_CANARY_BUSY';
      }
      // Grant sole canary permit
      state.canaryInFlight = true;
      return 'EXECUTE_CANARY';
    }

    return 'AVAILABLE';
  }

  /**
   * Crucial Requirement 4: Release canary lock on ANY terminal path.
   * Guarantees canaryInFlight is never stuck true.
   */
  public releaseCanaryIfHeld(modelId: string): void {
    const state = this.states.get(modelId);
    if (state && state.canaryInFlight) {
      state.canaryInFlight = false;
    }
  }

  /**
   * Record success: transitions model to AVAILABLE and resets failure tracking
   */
  public recordSuccess(modelId: string): void {
    const state = this.getState(modelId);
    state.status = 'AVAILABLE';
    state.cooldownUntil = 0;
    state.consecutiveFailures = 0;
    state.canaryInFlight = false;
    state.lastSuccessAt = Date.now();
    state.providerRetryAfterSeconds = undefined;
  }

  /**
   * Record failure: engages cooldown with provider delay / local backoff separation
   */
  public recordFailure(modelId: string, classified: ClassifiedGeminiError, now: number = Date.now()): void {
    const state = this.getState(modelId);
    state.consecutiveFailures++;
    state.lastFailureAt = now;
    state.lastFailureReason = classified.category;
    state.canaryInFlight = false;

    // Permanently disabled models (404, unsupported 403)
    if (classified.category === 'MODEL_NOT_FOUND' || classified.category === 'PERMISSION_DENIED_MODEL') {
      state.disabledForRuntime = true;
      state.status = 'COOLDOWN';
      state.cooldownUntil = Infinity;
      return;
    }

    if (classified.category === 'MODEL_SCOPED_QUOTA') {
      const providerDelayMs = classified.providerRetryAfterSeconds
        ? classified.providerRetryAfterSeconds * 1000
        : classified.suggestedCooldownMs;
      const blockedUntil = now + providerDelayMs;
      saveQuotaBlock({
        modelId,
        blockedUntil,
        quotaMetric: classified.quotaDiagnostics?.quotaMetric,
        quotaId: classified.quotaDiagnostics?.quotaId,
        quotaValue: classified.quotaDiagnostics?.quotaValue,
        dimensions: classified.quotaDiagnostics?.dimensions,
        retryAfterSeconds: classified.providerRetryAfterSeconds,
        updatedAt: new Date().toISOString()
      });
    }

    // Provider delay vs Local backoff calculation (Requirement 8)
    const providerDelayMs = classified.providerRetryAfterSeconds
      ? classified.providerRetryAfterSeconds * 1000
      : undefined;

    // Local exponential backoff for repeat failures
    const localBackoffFactor = Math.pow(2, Math.max(0, state.consecutiveFailures - 1));
    const localBackoffMs = Math.min(
      ROUTER_CONFIG.maxLocalBackoffMs,
      ROUTER_CONFIG.baseLocalBackoffMs * localBackoffFactor
    );

    // Effective cooldown: honor real Google delay if provided, never double Google delay
    const effectiveCooldownMs = Math.max(
      providerDelayMs ?? 0,
      localBackoffMs,
      classified.suggestedCooldownMs
    );

    state.status = 'COOLDOWN';
    state.cooldownUntil = now + effectiveCooldownMs;
    state.providerRetryAfterSeconds = classified.providerRetryAfterSeconds;
  }

  /**
   * Manually disable a model for the duration of this runtime process
   */
  public disableForRuntime(modelId: string, reason?: string): void {
    const state = this.getState(modelId);
    state.disabledForRuntime = true;
    state.status = 'COOLDOWN';
    state.cooldownUntil = Infinity;
    state.lastFailureReason = reason || 'DISABLED_FOR_RUNTIME';
    state.canaryInFlight = false;
  }

  /**
   * Testing & diagnostic helpers
   */
  public reset(): void {
    this.states.clear();
  }

  public setState(modelId: string, partial: Partial<ModelRuntimeState>): void {
    const state = this.getState(modelId);
    Object.assign(state, partial);
  }

  public getAllStates(): Record<string, ModelRuntimeState> {
    const result: Record<string, ModelRuntimeState> = {};
    for (const [k, v] of this.states.entries()) {
      result[k] = { ...v };
    }
    return result;
  }
}

// Export singleton instance for server runtime
export const circuitBreaker = new ModelCircuitBreaker();
