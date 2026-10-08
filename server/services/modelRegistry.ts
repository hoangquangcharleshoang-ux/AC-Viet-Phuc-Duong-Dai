/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2A.5: Model Registry & Task-Aware Model Pools
 */

export type GeminiTask = 'RECOMMENDATION' | 'BLUEPRINT' | 'EXPLORATION' | 'VISUAL_QA' | 'AC_CHAT';

export interface ModelConfig {
  id: string;
  family: 'flash' | 'flash-lite';
  role: 'classification-fast' | 'reasoning-heavy';
  tierPreference: number;
}

/**
 * CALL A — RECOMMENDATION MODEL POOL
 * Runtime product policy: gemini-3.5-flash-lite ONLY (no stronger model fallback)
 */
export const TASK_A_MODEL_POOL = [
  'gemini-3.5-flash-lite'
] as const;

const ROUTER_PROFILE = process.env.ROUTER_PROFILE || 'dev-lite';

/**
 * CALL B — BLUEPRINT GENERATION MODEL POOL
 * Runtime product policy: gemini-3.5-flash-lite ONLY (no stronger model fallback)
 */
export const TASK_B_MODEL_POOL = [
  'gemini-3.5-flash-lite'
] as const;

/**
 * GUIDED EXPLORATION BLUEPRINT MODEL POOL
 * Runtime product policy: gemini-3.5-flash-lite ONLY (no stronger model fallback)
 */
export const TASK_EXPLORATION_MODEL_POOL = [
  'gemini-3.5-flash-lite'
] as const;

/**
 * G3A — AC CHAT ASSISTANT MODEL POOL
 * Runtime product policy: gemini-3.5-flash-lite ONLY (no stronger model fallback)
 */
export const TASK_CHAT_MODEL_POOL = [
  'gemini-3.5-flash-lite'
] as const;

/**
 * CALL C — CULTURAL VISUAL QA MODEL POOL
 * Unchanged: Perception quality benchmarked separately across multi-model pool.
 */
export const TASK_C_MODEL_POOL = ROUTER_PROFILE === 'quality'
  ? [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite'
    ] as const
  : [
      'gemini-3.5-flash-lite',
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash'
    ] as const;

export type TaskAModelId = (typeof TASK_A_MODEL_POOL)[number];
export type TaskBModelId = (typeof TASK_B_MODEL_POOL)[number];
export type TaskExplorationModelId = (typeof TASK_EXPLORATION_MODEL_POOL)[number];
export type TaskChatModelId = (typeof TASK_CHAT_MODEL_POOL)[number];
export type TaskCModelId = (typeof TASK_C_MODEL_POOL)[number];
export type RouterModelId = TaskAModelId | TaskBModelId | TaskExplorationModelId | TaskChatModelId | TaskCModelId;

export const ALL_ROUTER_MODELS: RouterModelId[] = Array.from(
  new Set([...TASK_A_MODEL_POOL, ...TASK_B_MODEL_POOL, ...TASK_EXPLORATION_MODEL_POOL, ...TASK_CHAT_MODEL_POOL, ...TASK_C_MODEL_POOL])
);

export const MODEL_CONFIGS: Record<RouterModelId, ModelConfig> = {
  'gemini-3.8-flash': {
    id: 'gemini-3.8-flash',
    family: 'flash',
    role: 'reasoning-heavy',
    tierPreference: 1
  },
  'gemini-3.7-flash': {
    id: 'gemini-3.7-flash',
    family: 'flash',
    role: 'reasoning-heavy',
    tierPreference: 2
  },
  'gemini-3.6-flash': {
    id: 'gemini-3.6-flash',
    family: 'flash',
    role: 'reasoning-heavy',
    tierPreference: 3
  },
  'gemini-3.5-flash': {
    id: 'gemini-3.5-flash',
    family: 'flash',
    role: 'reasoning-heavy',
    tierPreference: 4
  },
  'gemini-3.5-flash-lite': {
    id: 'gemini-3.5-flash-lite',
    family: 'flash-lite',
    role: 'classification-fast',
    tierPreference: 1
  }
};

export function getModelPoolForTask(task: GeminiTask): readonly string[] {
  switch (task) {
    case 'RECOMMENDATION':
      return TASK_A_MODEL_POOL;
    case 'BLUEPRINT':
      return TASK_B_MODEL_POOL;
    case 'EXPLORATION':
      return TASK_EXPLORATION_MODEL_POOL;
    case 'AC_CHAT':
      return TASK_CHAT_MODEL_POOL;
    case 'VISUAL_QA':
      return TASK_C_MODEL_POOL;
    default: {
      const _exhaustive: never = task;
      throw new Error(`Unknown task: ${_exhaustive}`);
    }
  }
}
