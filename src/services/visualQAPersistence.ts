/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C: Client Visual QA & Revision History Persistence
 *
 * Requirements:
 * - Dedicated localStorage key: "ac_visual_qa_v1" (independent of ac_session_v1)
 * - Retains up to 5 most recent outfit generation threads (FIFO eviction)
 * - Stores structured metadata, trait verdicts, and revision chains (v0, v1, v2)
 * - ZERO base64 strings, ZERO image binaries, ZERO API keys
 * - Clean eviction upon Session Reset
 */

import {
  OutfitGenerationThread,
  LookbookRevisionItem,
  CulturalVisualQAOutput,
  GenerationSnapshot,
  GroundedCorrectionPlan,
  GarmentId
} from '../types/index';

export const VISUAL_QA_STORAGE_KEY = 'ac_visual_qa_v1';
export const MAX_PERSISTED_THREADS = 5;
export const MAX_PERSISTED_QA_RECORDS = 5;

export interface VisualQAPersistenceStore {
  schemaVersion: '1.0.0';
  threads: OutfitGenerationThread[];
  lastSavedAt: number;
}

/**
 * Load all persisted QA threads from localStorage
 */
export function loadVisualQAStore(): VisualQAPersistenceStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { schemaVersion: '1.0.0', threads: [], lastSavedAt: Date.now() };
  }

  try {
    const raw = window.localStorage.getItem(VISUAL_QA_STORAGE_KEY);
    if (!raw) {
      return { schemaVersion: '1.0.0', threads: [], lastSavedAt: Date.now() };
    }

    const parsed = JSON.parse(raw);
    if (!parsed || parsed.schemaVersion !== '1.0.0' || !Array.isArray(parsed.threads)) {
      console.warn('[VisualQAPersistence] Invalid store schema, resetting.');
      return { schemaVersion: '1.0.0', threads: [], lastSavedAt: Date.now() };
    }

    return parsed;
  } catch (err) {
    console.error('[VisualQAPersistence] Failed to load store:', err);
    return { schemaVersion: '1.0.0', threads: [], lastSavedAt: Date.now() };
  }
}

/**
 * Save store back to localStorage with FIFO limit
 */
export function saveVisualQAStore(store: VisualQAPersistenceStore): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // Keep max 5 threads (FIFO by lastUpdatedAt)
    const filtered = [...store.threads].sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt);
    const capped = filtered.slice(0, MAX_PERSISTED_QA_RECORDS);

    const payload: VisualQAPersistenceStore = {
      schemaVersion: '1.0.0',
      threads: capped,
      lastSavedAt: Date.now()
    };

    window.localStorage.setItem(VISUAL_QA_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.error('[VisualQAPersistence] Failed to save store:', err);
  }
}

/**
 * Find or create a thread for a boundFingerprint
 */
export function getThreadForFingerprint(
  boundFingerprint: string
): OutfitGenerationThread | null {
  const store = loadVisualQAStore();
  return store.threads.find(t => t.boundFingerprint === boundFingerprint) || null;
}

/**
 * Record a new Lookbook generation (v0 or revision v1/v2) into the thread
 */
export function recordLookbookRevision(params: {
  boundFingerprint: string;
  garmentId: GarmentId;
  generationId: string;
  revisionIndex: number;
  imageUrl: string;
  createdAt: number;
  expiresAt: number;
  snapshot: GenerationSnapshot;
  qaResult?: CulturalVisualQAOutput;
  correctionPlan?: GroundedCorrectionPlan;
}): OutfitGenerationThread {
  const store = loadVisualQAStore();
  const now = Date.now();

  let thread = store.threads.find(t => t.boundFingerprint === params.boundFingerprint);

  const newRevision: LookbookRevisionItem = {
    generationId: params.generationId,
    revisionIndex: params.revisionIndex,
    imageUrl: params.imageUrl,
    createdAt: params.createdAt,
    expiresAt: params.expiresAt,
    boundFingerprint: params.boundFingerprint,
    snapshot: params.snapshot,
    qaResult: params.qaResult,
    correctionPlan: params.correctionPlan
  };

  if (!thread) {
    thread = {
      boundFingerprint: params.boundFingerprint,
      garmentId: params.garmentId,
      activeRevisionIndex: params.revisionIndex,
      revisions: [newRevision],
      createdAt: now,
      lastUpdatedAt: now
    };
    store.threads.unshift(thread);
  } else {
    // If starting a brand new V0 lineage ("Tạo phương án khác"), reset revisions to [newRevision]
    const existingIndex = thread.revisions.findIndex(r => r.generationId === params.generationId);
    if (params.revisionIndex === 0 && existingIndex < 0) {
      thread.revisions = [newRevision];
    } else if (existingIndex >= 0) {
      thread.revisions[existingIndex] = {
        ...thread.revisions[existingIndex],
        ...newRevision
      };
    } else {
      // Remove any existing revision with the same revisionIndex to guarantee uniqueness
      thread.revisions = thread.revisions.filter(r => r.revisionIndex !== params.revisionIndex);
      thread.revisions.push(newRevision);
      // Sort revisions ascending by revisionIndex (0, 1, 2)
      thread.revisions.sort((a, b) => a.revisionIndex - b.revisionIndex);
    }
    thread.activeRevisionIndex = params.revisionIndex;
    thread.lastUpdatedAt = now;
  }

  saveVisualQAStore(store);
  return thread;
}

/**
 * Update QA Result on a specific generation inside a thread
 */
export function recordQAResult(
  generationId: string,
  boundFingerprint: string,
  qaResult: CulturalVisualQAOutput,
  correctionPlan?: GroundedCorrectionPlan
): OutfitGenerationThread | null {
  const store = loadVisualQAStore();
  const thread = store.threads.find(t => t.boundFingerprint === boundFingerprint);
  if (!thread) return null;

  const rev = thread.revisions.find(r => r.generationId === generationId);
  if (rev) {
    rev.qaResult = qaResult;
    if (correctionPlan) {
      rev.correctionPlan = correctionPlan;
    }
    thread.lastUpdatedAt = Date.now();
    saveVisualQAStore(store);
  }

  return thread;
}

/**
 * Direct lookup for a specific generationId from persisted store
 */
export function loadPersistedVisualQA(generationId: string): CulturalVisualQAOutput | null {
  const store = loadVisualQAStore();
  for (const thread of store.threads) {
    const rev = thread.revisions.find(r => r.generationId === generationId);
    if (rev && rev.qaResult) {
      return rev.qaResult;
    }
  }
  return null;
}

/**
 * Direct save of QA result for a generationId
 */
export function savePersistedVisualQA(qaOutput: CulturalVisualQAOutput): void {
  const store = loadVisualQAStore();
  let found = false;
  for (const thread of store.threads) {
    if (thread.boundFingerprint === qaOutput.boundFingerprint) {
      const rev = thread.revisions.find(r => r.generationId === qaOutput.generationId);
      if (rev) {
        rev.qaResult = qaOutput;
        thread.lastUpdatedAt = Date.now();
        found = true;
        break;
      }
    }
  }

  if (found) {
    saveVisualQAStore(store);
  }
}

/**
 * Clean eviction on Session Reset
 */
export function clearVisualQAPersistence(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(VISUAL_QA_STORAGE_KEY);
    console.log('[VisualQAPersistence] Cleared ac_visual_qa_v1 storage.');
  } catch (err) {
    console.warn('[VisualQAPersistence] Error clearing store:', err);
  }
}

export const clearPersistedVisualQA = clearVisualQAPersistence;
