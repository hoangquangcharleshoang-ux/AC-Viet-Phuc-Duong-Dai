/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2A.5R: Task-Aware Multi-Model Gemini Router (Optimized Runtime & Final Delta Patch)
 *
 * Requirements:
 * - Candidate pools locked (Call A: 3 models, Call B: 5 models)
 * - Per-candidate adaptive timeout (Call A cap: 4s, Call B cap: 7s) with fallback budget reservation
 * - Non-model failures (Client Abort, Stale Request, Route Deadline) NEVER penalize model health
 * - Genuine candidate timeout applies transient failure/cooldown to model
 * - Cooldown progression: 30s -> 60s -> 120s -> 240s -> 300s max
 * - Overall route deadline (Call A: 10s, Call B: 20s)
 * - Single canary lock for HALF_OPEN probe (releases on all terminal paths without false penalty)
 * - Shared in-flight dedup safety across consumers
 * - Stale after response does NOT cache or return as active
 * - Model-scoped 429 fallback & Project-scoped 429 fail-fast
 */

import { GeminiTask, getModelPoolForTask } from './modelRegistry';
import { circuitBreaker, ModelCircuitBreaker } from './circuitBreaker';
import { classifyGeminiError, ClassifiedGeminiError, ROUTER_CONFIG } from './geminiErrorClassifier';

export interface RouteMeta {
  generatedByModel: string;
  routedViaFallback: boolean;
  routerAttemptCount: number;
  executionTimeMs: number;
}

export interface RouteResult<T> {
  result: T;
  routeMeta: RouteMeta;
}

export interface RouteTaskOptions<T> {
  task: GeminiTask;
  requestId: string;
  executeWithModel: (modelId: string, isCanary: boolean, signal?: AbortSignal) => Promise<T>;
  repairWithModel?: (modelId: string, rawOutput: any, errorMsg: string, signal?: AbortSignal) => Promise<T>;
  customBreaker?: ModelCircuitBreaker;
  signal?: AbortSignal;
  isStillCurrent?: () => boolean;
  deadlineMs?: number;
  candidateTimeoutCapMs?: number;
}

function sanitizeErrorMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/sk-[a-zA-Z0-9_\-]{10,}/g, 'sk-[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_\-]{30,}/g, 'AIza[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/apiKey\s*[:=]\s*["']?[^"'\s,]+/gi, 'apiKey:[REDACTED]');
}

export class ModelRouterError extends Error {
  status: number;
  code: string;
  retryable: boolean;
  classified?: ClassifiedGeminiError;
  routeMeta?: Partial<RouteMeta>;

  constructor(status: number, code: string, message: string, retryable = true, classified?: ClassifiedGeminiError) {
    super(message);
    this.name = 'ModelRouterError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
    this.classified = classified;
  }
}

export class CandidateTimeoutError extends Error {
  code = 'CANDIDATE_TIMEOUT';
  status = 504;
  candidateModel: string;
  timeoutMs: number;

  constructor(candidateModel: string, timeoutMs: number) {
    super(`Mô hình ${candidateModel} phản hồi quá thời gian cho phép (${timeoutMs}ms).`);
    this.name = 'CandidateTimeoutError';
    this.candidateModel = candidateModel;
    this.timeoutMs = timeoutMs;
  }
}

async function withCandidateTimeout<T>(
  fn: (signal?: AbortSignal) => Promise<T>,
  timeoutMs: number,
  candidateModel: string
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      if (controller) {
        controller.abort();
      }
      reject(new CandidateTimeoutError(candidateModel, timeoutMs));
    }, timeoutMs);

    fn(controller?.signal)
      .then(res => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(res);
      })
      .catch(err => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Route a Gemini task through task-specific candidate pool with per-model circuit breaker and safe fallback.
 */
export async function routeGeminiTask<T>(options: RouteTaskOptions<T>): Promise<RouteResult<T>> {
  const { task, requestId, executeWithModel, repairWithModel, customBreaker } = options;
  const breaker = customBreaker || circuitBreaker;
  const pool = getModelPoolForTask(task);
  const startTime = Date.now();

  const routeDeadlineMs =
    options.deadlineMs ??
    (task === 'RECOMMENDATION'
      ? ROUTER_CONFIG.callADeadlineMs
      : task === 'VISUAL_QA'
      ? ROUTER_CONFIG.callCDeadlineMs
      : ROUTER_CONFIG.callBDeadlineMs);
  const deadlineAt = startTime + routeDeadlineMs;

  const candidateTimeoutCap =
    options.candidateTimeoutCapMs ??
    (task === 'RECOMMENDATION'
      ? ROUTER_CONFIG.callACandidateTimeoutCapMs
      : task === 'VISUAL_QA'
      ? ROUTER_CONFIG.callCCandidateTimeoutCapMs
      : ROUTER_CONFIG.callBCandidateTimeoutCapMs);

  const isCancelled = (): boolean => {
    if (options.signal?.aborted) return true;
    if (options.isStillCurrent && !options.isStillCurrent()) return true;
    return false;
  };

  const assertActive = () => {
    if (isCancelled()) {
      console.log(`[ModelRouter] Cancelled stale request`, { task, requestId });
      throw new ModelRouterError(
        499,
        'REQUEST_CANCELLED_STALE',
        'Yêu cầu đã bị hủy hoặc thay thế bởi thao tác mới.',
        false
      );
    }
    if (Date.now() >= deadlineAt) {
      console.warn(`[ModelRouter] Route deadline exceeded`, {
        task,
        requestId,
        routeDeadlineMs,
        executionTimeMs: Date.now() - startTime
      });
      throw new ModelRouterError(
        504,
        'GEMINI_ROUTER_DEADLINE_EXCEEDED',
        'Dịch vụ AI đang phản hồi chậm. Vui lòng thử lại sau giây lát.',
        true
      );
    }
  };

  let attemptCount = 0;
  let skippedCandidateCount = 0;
  let lastClassifiedError: ClassifiedGeminiError | undefined;

  for (let i = 0; i < pool.length; i++) {
    // 1. Check Cancellation and Route Deadline before every candidate
    assertActive();

    const candidateModel = pool[i];
    const candidateIndex = i + 1;
    const permit = breaker.evaluateModel(candidateModel);

    // 2. Skip candidate if on cooldown, canary busy, or disabled
    if (permit.startsWith('SKIP_')) {
      skippedCandidateCount++;
      const state = breaker.getState(candidateModel);
      const cooldownRemainingMs = state.cooldownUntil
        ? Math.max(0, state.cooldownUntil - Date.now())
        : 0;
      console.log(`[ModelRouter] Skip candidate`, {
        task,
        requestId,
        candidateModel,
        candidateIndex,
        decision: permit,
        cooldownRemainingMs,
        disabledForRuntime: state.disabledForRuntime
      });
      continue;
    }

    // 3. Adaptive candidate timeout & fallback budget reservation
    const now = Date.now();
    const remainingBudget = deadlineAt - now;
    if (remainingBudget < ROUTER_CONFIG.minCandidateTimeoutMs) {
      console.warn(`[ModelRouter] Remaining budget (${remainingBudget}ms) insufficient to start candidate ${candidateModel}`);
      break;
    }

    const remainingCandidatesAfterThis = pool.length - (i + 1);
    // Reserve budget for remaining candidates (dedicated reserve for Blueprint and Visual QA fallbacks)
    const reservePerCandidate = task === 'VISUAL_QA' ? 4500 : task === 'BLUEPRINT' ? 3000 : 2000;
    const fallbackReserveMs =
      remainingCandidatesAfterThis > 0
        ? Math.min(remainingBudget * 0.35, remainingCandidatesAfterThis * reservePerCandidate)
        : 0;

    // For VISUAL_QA: limit to at most 2 attempts (primary + 1 fallback) to ensure clean termination before outer proxy ceiling
    if (task === 'VISUAL_QA' && attemptCount >= 2) {
      console.log(`[ModelRouter] VISUAL_QA reached maximum attempt limit (2), avoiding sequential proxy timeout`);
      break;
    }

    // Strict rawAvailable calculation: DO NOT artificially inflate to minCandidateTimeoutMs,
    // which would eat into fallbackReserveMs!
    const rawAvailableForCandidate = remainingBudget - fallbackReserveMs;

    // Internal safety margin ensuring candidate timeout deadline strictly precedes global route deadline
    const safetyMarginMs = ROUTER_CONFIG.routeDeadlineSafetyMarginMs ?? 250;
    const safeAvailableForCandidate = rawAvailableForCandidate - safetyMarginMs;

    if (safeAvailableForCandidate < ROUTER_CONFIG.minCandidateTimeoutMs) {
      if (remainingCandidatesAfterThis > 0) {
        console.warn(
          `[ModelRouter] Candidate ${candidateModel} skipped: safeAvailable (${safeAvailableForCandidate}ms) < minTimeout (${ROUTER_CONFIG.minCandidateTimeoutMs}ms), strictly preserving fallback reserve (${fallbackReserveMs}ms) for remaining ${remainingCandidatesAfterThis} candidate(s)`
        );
        skippedCandidateCount++;
        continue;
      } else {
        console.warn(
          `[ModelRouter] Final candidate ${candidateModel} cannot start: safeAvailable (${safeAvailableForCandidate}ms) < minTimeout (${ROUTER_CONFIG.minCandidateTimeoutMs}ms)`
        );
        break;
      }
    }

    const candidateTimeoutMs = Math.min(candidateTimeoutCap, safeAvailableForCandidate);

    const isCanary = permit === 'EXECUTE_CANARY';
    attemptCount++;

    console.log(`[ModelRouter] Candidate decision`, {
      task,
      requestId,
      candidateModel,
      candidateIndex,
      decision: isCanary ? 'EXECUTE_CANARY' : 'EXECUTE',
      candidateTimeoutMs,
      remainingBudget,
      isFallback: candidateIndex > 1
    });

    let candidateSuccess = false;
    let candidateResult: T | undefined;

    // Terminal path guarantee: release canary in finally block
    try {
      assertActive();
      try {
        candidateResult = await withCandidateTimeout(
          (sig) => executeWithModel(candidateModel, isCanary, sig),
          candidateTimeoutMs,
          candidateModel
        );
        candidateSuccess = true;
      } catch (firstErr: any) {
        // Safe upstream diagnostic logging
        console.error(`[ModelRouter] Upstream Inference Error (${candidateModel}):`, {
          task,
          requestId,
          candidateModel,
          status: firstErr?.status || firstErr?.statusCode || firstErr?.response?.status,
          errorCode: firstErr?.code || firstErr?.error?.code,
          errorType: firstErr?.type || firstErr?.error?.type,
          messageSanitized: sanitizeErrorMessage(firstErr?.message || String(firstErr))
        });
        // A. HARD INVARIANT 1: Client / Business Cancellation (NEVER penalize model health!)
        if (
          isCancelled() ||
          firstErr?.name === 'AbortError' ||
          firstErr?.code === 'REQUEST_CANCELLED_STALE'
        ) {
          console.log(`[ModelRouter] Request was cancelled/superseded; model health preserved without penalty`, {
            task,
            requestId,
            candidateModel
          });
          throw new ModelRouterError(
            499,
            'REQUEST_CANCELLED_STALE',
            'Yêu cầu đã bị hủy hoặc thay thế bởi thao tác mới.',
            false
          );
        }

        // B. HARD INVARIANT 2: Global Route Deadline Exceeded (NOT a per-candidate timeout)
        if (Date.now() >= deadlineAt) {
          console.warn(`[ModelRouter] Route deadline exceeded; model health preserved without penalty`, {
            task,
            requestId,
            candidateModel
          });
          throw new ModelRouterError(
            504,
            'GEMINI_ROUTER_DEADLINE_EXCEEDED',
            'Dịch vụ AI đang phản hồi chậm. Vui lòng thử lại sau giây lát.',
            true
          );
        }

        // C. Genuine Candidate Timeout or Provider Error
        let classified: ClassifiedGeminiError;
        if (firstErr?.code === 'CANDIDATE_TIMEOUT') {
          classified = {
            status: 504,
            category: 'TIMEOUT_OR_NETWORK',
            severity: 'FALLBACK_CANDIDATE',
            message: firstErr.message || `Mô hình ${candidateModel} phản hồi quá thời gian cho phép.`,
            modelId: candidateModel,
            retryable: true,
            suggestedCooldownMs: ROUTER_CONFIG.serviceUnavailableCooldownMs,
            rawError: firstErr
          };
        } else {
          classified = classifyGeminiError(firstErr, candidateModel);
        }
        lastClassifiedError = classified;

        // Schema / Malformed output repair (max 1 repair attempt on the same model)
        if (classified.category === 'MALFORMED_OUTPUT' && repairWithModel) {
          assertActive();
          const repairBudget = deadlineAt - Date.now();
          if (repairBudget >= ROUTER_CONFIG.minCandidateTimeoutMs) {
            const repairTimeoutMs = Math.min(candidateTimeoutCap, repairBudget);
            console.warn(`[ModelRouter] Candidate returned malformed output, attempting repair once (${repairTimeoutMs}ms)`, {
              task,
              requestId,
              candidateModel
            });
            try {
              candidateResult = await withCandidateTimeout(
                (sig) => repairWithModel(candidateModel, firstErr?.rawOutput, firstErr?.message, sig),
                repairTimeoutMs,
                candidateModel
              );
              candidateSuccess = true;
            } catch (repairErr: any) {
              if (isCancelled() || repairErr?.name === 'AbortError') {
                throw new ModelRouterError(499, 'REQUEST_CANCELLED_STALE', 'Yêu cầu đã bị hủy hoặc thay thế.', false);
              }
              classified = classifyGeminiError(repairErr, candidateModel);
              lastClassifiedError = classified;
            }
          }
        }

        // If not successful: record failure in circuit breaker
        if (!candidateSuccess) {
          // Record failure in circuit breaker (applies transient/quota cooldown)
          breaker.recordFailure(candidateModel, classified);

          // Fail-Fast categories: terminate router immediately
          if (classified.severity === 'FAIL_FAST') {
            console.error(`[ModelRouter] Fail-Fast encountered, terminating router`, {
              task,
              requestId,
              candidateModel,
              category: classified.category,
              message: classified.message
            });

            throw new ModelRouterError(
              classified.status,
              classified.category,
              classified.message,
              classified.retryable,
              classified
            );
          }

          // Fallback to next candidate (NO same-model retry for 503/timeout!)
          console.warn(`[ModelRouter] Candidate failed, falling back to next candidate`, {
            task,
            requestId,
            candidateModel,
            category: classified.category,
            quotaScope: classified.quotaDiagnostics?.scope,
            providerRetryAfterSeconds: classified.providerRetryAfterSeconds,
            nextCandidate: pool[i + 1] || 'NONE'
          });
        }
      }
    } finally {
      // Release canary lock on ANY terminal path
      if (isCanary) {
        breaker.releaseCanaryIfHeld(candidateModel);
      }
    }

    // If candidate succeeded, check cancellation once more before caching/returning
    if (candidateSuccess && candidateResult !== undefined) {
      if (isCancelled()) {
        console.log(`[ModelRouter] Dropping response of superseded/cancelled request`, {
          task,
          requestId
        });
        throw new ModelRouterError(
          499,
          'REQUEST_CANCELLED_STALE',
          'Yêu cầu đã bị hủy hoặc thay thế bởi thao tác mới.',
          false
        );
      }

      breaker.recordSuccess(candidateModel);

      const executionTimeMs = Date.now() - startTime;
      const routedViaFallback = candidateIndex > 1;

      console.log(`[ModelRouter] Route success`, {
        task,
        requestId,
        generatedByModel: candidateModel,
        routedViaFallback,
        routerAttemptCount: attemptCount,
        skippedCandidateCount,
        executionTimeMs
      });

      return {
        result: candidateResult,
        routeMeta: {
          generatedByModel: candidateModel,
          routedViaFallback,
          routerAttemptCount: attemptCount,
          executionTimeMs
        }
      };
    }
  }

  // Check if route deadline was exceeded or remaining budget was exhausted
  const finalNow = Date.now();
  if (finalNow >= deadlineAt || (deadlineAt - finalNow) < ROUTER_CONFIG.minCandidateTimeoutMs) {
    throw new ModelRouterError(
      504,
      'GEMINI_ROUTER_DEADLINE_EXCEEDED',
      'Dịch vụ AI đang phản hồi chậm. Vui lòng thử lại sau giây lát.',
      true
    );
  }

  // All candidates in the pool are exhausted or in cooldown
  console.error(`[ModelRouter] All compatible models exhausted for task: ${task}`, {
    task,
    requestId,
    attemptCount,
    skippedCandidateCount,
    pool,
    lastCategory: lastClassifiedError?.category
  });

  throw new ModelRouterError(
    503,
    'NO_COMPATIBLE_MODEL_AVAILABLE',
    'Dịch vụ AI đang tạm thời không khả dụng. Vui lòng thử lại sau.',
    true,
    lastClassifiedError
  );
}
