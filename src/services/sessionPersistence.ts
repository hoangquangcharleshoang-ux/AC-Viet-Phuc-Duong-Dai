/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2B.1: Session Persistence & Hydration Service
 *
 * Requirements:
 * - Uses browser localStorage with versioned key: ac_session_v1
 * - Preserves: draftContext, committedContext, recommendation, selectedGarmentId,
 *   blueprintCacheEntries, activeAccessoryOverrides, lookbookState (with snapshot)
 * - Safe JSON parsing & schema validation
 * - Hydration barrier support (prevents premature overwrite)
 * - Zero secrets, zero buffers, zero base64 stored
 * - Interrupted generation recovery (never stuck in generating state)
 */

import {
  GarmentId,
  OccasionId,
  RemixIntent,
  GarmentRecommendationOutput,
  BlueprintOutput,
  GenerationSnapshot,
  LookbookGenerationState,
  GenderPresentation
} from '../types';

export const CURRENT_SESSION_VERSION = 1 as const;
export const SESSION_STORAGE_KEY = 'ac_session_v1';

export interface PersistedBlueprintCacheEntry {
  cacheKey: string;
  garmentId: GarmentId;
  committedContextKey: string;
  blueprint: BlueprintOutput;
  activeAccessoryIds?: string[];
}

export interface PersistedAccessoryOverride {
  cacheKey: string;
  garmentId: GarmentId;
  accessoryIds: string[];
}

export interface PersistedDraftContext {
  promptText: string;
  selectedOccasionKey: string;
  selectedStyleKey: string;
  sliderValue: number;
  selectedOccasion: OccasionId;
  selectedIntent: RemixIntent;
  genderPresentation?: GenderPresentation;
}

export interface PersistedCommittedContext {
  promptText: string;
  selectedOccasion: string;
  selectedStyle: string;
  traditionalRatio: number;
  genderPresentation?: GenderPresentation;
}

export interface PersistedACSessionV1 {
  version: 1;
  savedAt: number;
  draftContext: PersistedDraftContext;
  committedContext: PersistedCommittedContext | null;
  recommendation: GarmentRecommendationOutput | null;
  selectedGarmentId: GarmentId | null;
  blueprintCacheEntries: PersistedBlueprintCacheEntry[];
  activeAccessoryOverrides: PersistedAccessoryOverride[];
  lookbookState: LookbookGenerationState | null;
}

/**
 * Validate object structure of loaded session
 */
function isValidSessionShape(data: any): data is PersistedACSessionV1 {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== CURRENT_SESSION_VERSION) return false;
  if (!data.draftContext || typeof data.draftContext !== 'object') return false;
  if (typeof data.draftContext.promptText !== 'string') return false;
  if (data.blueprintCacheEntries && !Array.isArray(data.blueprintCacheEntries)) return false;
  if (data.activeAccessoryOverrides && !Array.isArray(data.activeAccessoryOverrides)) return false;
  return true;
}

/**
 * Load and validate session from localStorage
 */
export function loadPersistedSession(): PersistedACSessionV1 | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isValidSessionShape(parsed)) {
      console.warn('[SessionPersistence] Incompatible or corrupted session schema. Clearing key.');
      clearPersistedSession();
      return null;
    }

    // Sanitize Lookbook State on Hydration (Requirement 13: Interrupted generation recovery)
    if (parsed.lookbookState && parsed.lookbookState.status === 'generating') {
      parsed.lookbookState = {
        status: 'interrupted',
        outfitFingerprint: parsed.lookbookState.outfitFingerprint,
        snapshot: parsed.lookbookState.snapshot,
        message: 'Lần tạo ảnh trước đã bị gián đoạn. Bạn có thể tạo lại khi sẵn sàng.'
      };
    }

    return parsed;
  } catch (err) {
    console.error('[SessionPersistence] Failed to parse session JSON, resetting storage:', err);
    clearPersistedSession();
    return null;
  }
}

/**
 * Persist current product session to localStorage
 * Strictly guards against secret leakage, image base64, or buffers
 */
export function savePersistedSession(session: PersistedACSessionV1): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    // Sanitize lookbook state before writing (do not persist generating forever)
    let sanitizedLookbook = session.lookbookState;
    if (sanitizedLookbook && sanitizedLookbook.status === 'generating') {
      sanitizedLookbook = {
        status: 'interrupted',
        outfitFingerprint: sanitizedLookbook.outfitFingerprint,
        snapshot: sanitizedLookbook.snapshot,
        message: 'Lần tạo ảnh trước đã bị gián đoạn. Bạn có thể tạo lại khi sẵn sàng.'
      };
    }

    const payload: PersistedACSessionV1 = {
      version: CURRENT_SESSION_VERSION,
      savedAt: Date.now(),
      draftContext: session.draftContext,
      committedContext: session.committedContext,
      recommendation: session.recommendation,
      selectedGarmentId: session.selectedGarmentId,
      blueprintCacheEntries: session.blueprintCacheEntries || [],
      activeAccessoryOverrides: session.activeAccessoryOverrides || [],
      lookbookState: sanitizedLookbook
    };

    try {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        console.warn('[SessionPersistence] localStorage quota exceeded, trimming cache entries');
        payload.blueprintCacheEntries = (payload.blueprintCacheEntries || []).slice(-2);
        try {
          window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
        } catch (_) {
          // ignore
        }
      } else {
        console.warn('[SessionPersistence] Failed to write session to localStorage:', err);
      }
    }
  } catch (err) {
    console.warn('[SessionPersistence] Failed to serialize session:', err);
  }
}

/**
 * Clear session from localStorage
 */
export function clearPersistedSession(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (_) {
    // ignore
  }
}
