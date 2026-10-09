/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Client-Side API Service, Invalidation Engine, Caching & Stale-Response Protection
 */

import {
  GarmentId,
  OccasionId,
  RemixIntent,
  SlotId,
  OutfitState,
  LinterEvaluationResult,
  DossierData,
  CuratedOption,
  GarmentRecommendationOutput,
  BlueprintOutput,
  ExplorationIntent,
  ExplorationBlueprintResult
} from '../types/index';
import {
  GARMENTS,
  OCCASIONS,
  CURATED_OPTIONS,
  getRelevantEvidenceFragments
} from '../data/culturalKnowledgePack';

// In-Memory Deterministic State Cache pre-seeded with Canonical Gemini Structured Reasoning evaluations
const linterCache = new Map<string, LinterEvaluationResult>([
  // Case 1: Ao tac + Tailored Trousers in Tet Temple -> PRESERVES_IDENTITY
  [
    'tet_temple|balanced|ao_tac|bottom|tailored_trousers_straight|natural_straight_khoan_tu_wide_box_right_flap_buttons',
    {
      status: 'PRESERVES_IDENTITY',
      reason_code: 'NONE',
      reasoning_basis: 'REASONABLE_INTERPRETATION',
      impacted_trait: 'Quần âu thụng đứng',
      trait_level: null,
      cultural_impact: 'Việc kết hợp Áo tấc với quần âu thụng đứng thuộc styling space đương đại, không can thiệp vào các đặc trưng thiết yếu (essential traits) như cổ đứng lập lĩnh hay ống tay thụng rộng. Phom dáng buông suông trang nhã của quần âu vẫn giữ được sự đoan chính, mực thước của lễ phục.',
      context_impact: 'Bảo toàn sự trang nghiêm trong không gian tế tự gia tộc, mang lại vẻ ngoài lịch thiệp giao thoa đương đại.',
      evidence_status: 'VERIFIED',
      evidence_anchors: ['SRC-04', 'SRC-05'],
      creative_suggestion: 'Nên chọn quần âu gam màu trung tính (trắng, kem, be hoặc đen) có độ rủ mềm mại để hài hòa cùng độ rủ của tà áo tấc.',
      alternative_action: null,
      uncertainty_note: null
    }
  ],
  // Case 1 variation: Leather loafer
  [
    'tet_temple|balanced|ao_tac|footwear|leather_loafer|natural_straight_khoan_tu_wide_box_right_flap_buttons',
    {
      status: 'PRESERVES_IDENTITY',
      reason_code: 'NONE',
      reasoning_basis: 'REASONABLE_INTERPRETATION',
      impacted_trait: 'Loafer da cổ điển',
      trait_level: null,
      cultural_impact: 'Giày loafer da cổ điển thuộc nhóm styling space đương đại, có kiểu dáng kín đáo, chỉn chu, hoàn toàn tôn trọng phom dáng và sự tề chỉnh của Áo tấc.',
      context_impact: 'Rất phù hợp cho dịp lễ Tết gia đình và viếng đình miếu, giữ được phong thái đĩnh đạc.',
      evidence_status: 'VERIFIED',
      evidence_anchors: ['SRC-04', 'SRC-05'],
      creative_suggestion: 'Phối loafer màu đen hoặc nâu trầm cùng quần âu sáng màu tạo sự tương phản thanh lịch.',
      alternative_action: null,
      uncertainty_note: null
    }
  ],
  // Case 2: Chunky Sneaker on Ao tac in Tet Temple -> CONTEXT_SENSITIVE (CONTEXT_FUNCTION_CONFLICT)
  [
    'tet_temple|balanced|ao_tac|footwear|chunky_sneaker|natural_straight_khoan_tu_wide_box_right_flap_buttons',
    {
      status: 'CONTEXT_SENSITIVE',
      reason_code: 'CONTEXT_FUNCTION_CONFLICT',
      reasoning_basis: 'REASONABLE_INTERPRETATION',
      impacted_trait: 'Giày dép & Công năng bối cảnh',
      trait_level: null,
      cultural_impact: 'Áo tấc vốn là lễ phục trang nghiêm trong nghi thức quan-hôn-tang-tế và tế tự đình miếu thời Nguyễn. Giày chunky sneaker có phom dáng thể thao hầm hố, đế thô dày tạo ra sự xung đột trực tiếp với tính chất đoan chính, khiêm cung của không gian tâm linh.',
      context_impact: 'Gây cảm giác lệch chuẩn công năng khi hành lễ trước bàn thờ tổ tiên hoặc không gian đình miếu ngày Tết.',
      evidence_status: 'VERIFIED',
      evidence_anchors: ['SRC-04'],
      creative_suggestion: 'Nếu bạn cần sự êm ái khi di chuyển, hãy cân nhắc giày sneaker tối giản đơn sắc (minimalist), loafer da cổ điển, hoặc chuyển sang Áo ngũ thân tay chẽn (tiện phục thường nhật).',
      alternative_action: 'Thay bằng Loafer da cổ điển hoặc Guốc mộc truyền thống.',
      uncertainty_note: null
    }
  ],
  // Case 3: Sleeves changed to trach_tu_fitted on Ao tac -> CHANGES_CORE_IDENTIFICATION (CORE_TRAIT_CHANGED)
  [
    'tet_temple|balanced|ao_tac|sleeves|trach_tu_fitted|natural_straight_khoan_tu_wide_box_right_flap_buttons',
    {
      status: 'CHANGES_CORE_IDENTIFICATION',
      reason_code: 'CORE_TRAIT_CHANGED',
      reasoning_basis: 'REASONABLE_INTERPRETATION',
      impacted_trait: 'Ống tay áo thụng rộng hình chữ nhật (khoán tụ)',
      trait_level: 'essential',
      cultural_impact: 'Ống tay thụng rộng (khoán tụ) là đặc trưng thiết yếu (essential trait) định danh Áo tấc trước Áo ngũ thân tay chẽn. Thao tác thu hẹp ống tay thành tay chẽn ôm sát cổ tay đã làm trang phục dịch chuyển hoàn toàn khỏi nhận diện Áo tấc, biến đổi sang diện mạo của Áo ngũ thân tay chẽn.',
      context_impact: 'Làm mất đi tư thế chắp tay giao thụng trang nghiêm vốn là cốt lõi nghi lễ của Áo tấc.',
      evidence_status: 'VERIFIED',
      evidence_anchors: ['SRC-04', 'SRC-05'],
      creative_suggestion: 'Nếu ưu tiên sự gọn gàng cho đôi tay, bạn nên chọn trang phục nền ngay từ đầu là Áo ngũ thân tay chẽn (thường phục quy chuẩn).',
      alternative_action: 'Giữ nguyên ống tay thụng rộng hình chữ nhật để bảo toàn nhận diện Áo tấc.',
      uncertainty_note: null
    }
  ],
  // Case 4: Stylized Tassel Fan -> INSUFFICIENT_EVIDENCE (creative_suggestion = null)
  [
    'tet_temple|balanced|ao_tac|accessories|stylized_tassel_fan|natural_straight_khoan_tu_wide_box_right_flap_buttons',
    {
      status: 'INSUFFICIENT_EVIDENCE',
      reason_code: 'EVIDENCE_INSUFFICIENT',
      reasoning_basis: 'UNKNOWN_OR_DISPUTED',
      impacted_trait: 'Quạt cách điệu tua rua',
      trait_level: null,
      cultural_impact: 'Chưa tìm thấy tư liệu lịch sử hoặc hiện vật bảo tàng thời Nguyễn xác nhận việc sử dụng loại quạt xếp kèm tua rua dài cách điệu này trong trang phục truyền thống.',
      context_impact: 'Phụ kiện này thường xuất hiện trong phim ảnh cổ trang đương đại, chưa đủ căn cứ văn hóa để khẳng định tính chuẩn mực di sản.',
      evidence_status: 'UNKNOWN',
      evidence_anchors: [],
      creative_suggestion: null,
      alternative_action: null,
      uncertainty_note: 'Hệ thống thể hiện sự khiêm tốn tri thức: chưa đủ bằng chứng kết luận, không tự gán ghép xuất xứ ngoại lai.'
    }
  ]
]);

/**
 * Deterministic State Fingerprint Hash
 * Combines: occasion_id + remix_intent + garment_base + changed_slot + new_value + core_anatomy_state
 */
export function computeStateFingerprint(
  occasionId: OccasionId,
  remixIntent: RemixIntent,
  garmentId: GarmentId,
  changedSlot: SlotId,
  newValue: string,
  coreAnatomy: { silhouette: string; sleeves: string; closure: string }
): string {
  return `${occasionId}|${remixIntent}|${garmentId}|${changedSlot}|${newValue}|${coreAnatomy.silhouette}_${coreAnatomy.sleeves}_${coreAnatomy.closure}`;
}

/**
 * 1. Fetch Disambiguation Contextual Rationale for Screen 2
 */
export async function fetchDisambiguationRationale(
  occasionId: OccasionId,
  remixIntent: RemixIntent
): Promise<string> {
  const occasion = OCCASIONS[occasionId];
  try {
    const data = await fetchJsonApi<{ rationale: string }>('/api/disambiguation-rationale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        occasion,
        remix_intent: remixIntent,
        garments: Object.values(GARMENTS).map(g => ({
          id: g.id,
          name: g.canonical_name,
          function: g.historical_function
        }))
      })
    }, 'Lỗi lấy lý do phân định');
    return data.rationale || 'Vui lòng tham khảo bảng so sánh cấu trúc di sản đối chiếu giữa các dáng áo.';
  } catch (err) {
    console.warn('Rationale fetch failed, returning grounded default', err);
    return `Trong bối cảnh ${occasion.name}, Áo tấc phát huy trọn vẹn nét trang nghiêm chuẩn mực của lễ phục quan-hôn-tang-tế, trong khi Áo ngũ thân tay chẽn tối ưu cho sự năng động và linh hoạt di chuyển. Bạn có thể cân nhắc tùy theo mục đích tham dự.`;
  }
}

/**
 * 2. Cultural Linter Evaluation with Stale Protection & Exact Caching
 */
export async function evaluateSlotChange(
  currentState: OutfitState,
  changedSlot: SlotId,
  newValue: string,
  optionMeta: CuratedOption
): Promise<{ result: LinterEvaluationResult; isStale: boolean }> {
  const targetVersion = currentState.state_version;
  const fingerprint = computeStateFingerprint(
    currentState.context.occasion_id,
    currentState.context.remix_intent,
    currentState.garment_base,
    changedSlot,
    newValue,
    currentState.core_anatomy
  );

  // Check deterministic cache
  if (linterCache.has(fingerprint)) {
    return {
      result: linterCache.get(fingerprint)!,
      isStale: false
    };
  }

  // Look up relevant evidence fragments from Master v1.0
  const relevantFragments = getRelevantEvidenceFragments(
    currentState.garment_base,
    changedSlot,
    newValue
  );

  const payload = {
    request_id: `req_${currentState.session_id}_v${targetVersion}`,
    state_version: targetVersion,
    context: {
      occasion_id: currentState.context.occasion_id,
      occasion_name: currentState.context.occasion_name,
      remix_intent: currentState.context.remix_intent
    },
    garment_base: {
      id: currentState.garment_base,
      name: GARMENTS[currentState.garment_base].canonical_name,
      historical_function: GARMENTS[currentState.garment_base].historical_function,
      fixed_metadata: GARMENTS[currentState.garment_base].fixed_metadata
    },
    interaction_event: {
      changed_slot: changedSlot,
      previous_value: (currentState as any)[changedSlot] || '',
      new_value: newValue,
      option_metadata: optionMeta
    },
    current_outfit_state: {
      silhouette: currentState.core_anatomy.silhouette,
      sleeves: currentState.core_anatomy.sleeves,
      closure: currentState.core_anatomy.closure,
      inner_chest: currentState.layering_lower.inner_chest,
      bottom: currentState.layering_lower.bottom,
      material_finish: currentState.surface_material.material_finish,
      footwear: currentState.contemporary_styling.footwear,
      outerwear: currentState.contemporary_styling.outerwear,
      accessories: currentState.contemporary_styling.accessories
    },
    relevant_evidence_fragments: relevantFragments
  };

  try {
    const data = await fetchJsonApi<{ state_version: number; evaluation: LinterEvaluationResult }>('/api/evaluate-linter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 'Lỗi kiểm định linter');

    // STALE RESPONSE PROTECTION:
    // If the server response state_version is older than the current UI state_version,
    // we DROP this response to prevent race conditions.
    if (data.state_version < currentState.state_version) {
      return {
        result: data.evaluation,
        isStale: true
      };
    }

    // Cache the valid response
    linterCache.set(fingerprint, data.evaluation);

    return {
      result: data.evaluation,
      isStale: false
    };
  } catch (error) {
    console.error('Failed to evaluate linter:', error);
    // Technical state fallback
    const technicalFallback: LinterEvaluationResult = {
      status: 'EVALUATION_UNAVAILABLE',
      reason_code: 'NONE',
      reasoning_basis: 'UNKNOWN_OR_DISPUTED',
      impacted_trait: optionMeta.display_name,
      trait_level: null,
      cultural_impact: 'AC hiện chưa thể kiểm định thay đổi này do sự cố kết nối. Bạn vẫn có thể tiếp tục phối đồ.',
      context_impact: 'Chưa có dữ liệu kiểm định cho bối cảnh hiện tại.',
      evidence_status: 'UNKNOWN',
      evidence_anchors: [],
      creative_suggestion: null,
      alternative_action: null,
      uncertainty_note: 'Hệ thống không chặn thao tác của bạn.'
    };
    return {
      result: technicalFallback,
      isStale: false
    };
  }
}

/**
 * 3. Dossier Synthesis (Screen 4)
 * Synthesizes final outfit state from ACTIVE evaluations only
 */
export async function synthesizeDossier(
  outfitState: OutfitState
): Promise<DossierData> {
  const garment = GARMENTS[outfitState.garment_base];

  // Helper to map option_id to display_name
  const getLabel = (optId: string) => {
    const opt = CURATED_OPTIONS.find(o => o.option_id === optId);
    return opt ? opt.display_name : optId;
  };

  const finalOutfitSummary = {
    garment_name: garment.canonical_name,
    garment_id: garment.id,
    silhouette: getLabel(outfitState.core_anatomy.silhouette),
    sleeves: getLabel(outfitState.core_anatomy.sleeves),
    closure: getLabel(outfitState.core_anatomy.closure),
    inner_chest: getLabel(outfitState.layering_lower.inner_chest),
    bottom: getLabel(outfitState.layering_lower.bottom),
    material_finish: getLabel(outfitState.surface_material.material_finish),
    footwear: getLabel(outfitState.contemporary_styling.footwear),
    outerwear: getLabel(outfitState.contemporary_styling.outerwear),
    accessories: getLabel(outfitState.contemporary_styling.accessories)
  };

  // Collect evidence anchors from ACTIVE evaluations and garment sources
  const anchorsSet = new Set<string>(garment.sources);
  Object.values(outfitState.active_evaluations).forEach(ev => {
    ev.evidence_anchors?.forEach(a => anchorsSet.add(a));
  });

  const payload = {
    final_outfit_state: finalOutfitSummary,
    active_evaluations: outfitState.active_evaluations, // strictly active, no obsolete
    context: outfitState.context,
    evidence_anchors: Array.from(anchorsSet)
  };

  try {
    const data = await fetchJsonApi<{ dossier: DossierData }>('/api/synthesize-dossier', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, 'Lỗi tổng hợp hồ sơ');
    return data.dossier;
  } catch (err) {
    console.error('Dossier synthesis failed, falling back to local synthesis', err);
    // Deterministic fallback
    const evals = Object.values(outfitState.active_evaluations);
    let overallStatus: any = 'PRESERVES_IDENTITY';
    if (evals.some(e => e.status === 'CHANGES_CORE_IDENTIFICATION')) overallStatus = 'CHANGES_CORE_IDENTIFICATION';
    else if (evals.some(e => e.status === 'WEAKENS_RECOGNIZABILITY')) overallStatus = 'WEAKENS_RECOGNIZABILITY';
    else if (evals.some(e => e.status === 'CONTEXT_SENSITIVE')) overallStatus = 'CONTEXT_SENSITIVE';
    else if (evals.some(e => e.status === 'INSUFFICIENT_EVIDENCE')) overallStatus = 'INSUFFICIENT_EVIDENCE';

    return {
      visual_outfit_summary: {
        garment_name: garment.canonical_name,
        silhouette_label: finalOutfitSummary.silhouette,
        sleeves_label: finalOutfitSummary.sleeves,
        closure_label: finalOutfitSummary.closure,
        inner_chest_label: finalOutfitSummary.inner_chest,
        bottom_label: finalOutfitSummary.bottom,
        material_finish_label: finalOutfitSummary.material_finish,
        footwear_label: finalOutfitSummary.footwear,
        outerwear_label: finalOutfitSummary.outerwear,
        accessories_label: finalOutfitSummary.accessories
      },
      overall_cultural_status: overallStatus,
      what_you_kept: [
        `Phom dáng thân áo ${garment.canonical_name} chuẩn mực thời Nguyễn`,
        'Quy chế cổ đứng lập lĩnh ôm khít chân cổ',
        'Hàng khuy cài nách phải hình chữ quảng',
        'Chất liệu tự nhiên tôn độ rủ mộc mạc'
      ],
      what_you_remixed: [
        `Hạ phục: ${finalOutfitSummary.bottom}`,
        `Giày: ${finalOutfitSummary.footwear}`,
        finalOutfitSummary.accessories !== 'Không phụ kiện' ? `Phụ kiện: ${finalOutfitSummary.accessories}` : 'Không phụ kiện rườm rà'
      ],
      cultural_impact_summary:
        'Bản phối bảo toàn kết cấu nhận diện cốt lõi theo tư liệu Master v1.0. Các biến tấu ở tầng styling phụ kiện tạo sự hài hòa đương đại mà không làm sai lệch quy chế hình thái.',
      contemporary_styling_rationale:
        'Sự kết hợp giữa phom áo cổ truyền và hạ phục đương đại giúp tối ưu hóa sự thoải mái cho người trẻ trong bối cảnh sinh hoạt và giao tế.',
      evidence_anchors: Array.from(anchorsSet),
      context_note: `Lựa chọn phù hợp cho ${outfitState.context.occasion_name}, cân bằng giữa bảo tồn di sản và biểu đạt cá nhân.`
    };
  }
}

/**
 * Phase 2A: Runtime Stability & API Error Contract
 */
export class ApiError extends Error {
  code: string;
  retryable: boolean;
  status: number;
  retryAfterSeconds?: number;

  constructor(code: string, message: string, retryable = false, status = 500, retryAfterSeconds?: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.retryable = retryable;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function fetchJsonApi<T>(
  url: string,
  options: RequestInit,
  defaultErrorMsg = 'Lỗi yêu cầu máy chủ'
): Promise<T> {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const xAcApiResponse = res.headers.get('x-ac-api-response') || '0';
  const isJson = contentType.includes('application/json');

  if (!isJson || xAcApiResponse !== '1') {
    const bodyText = await res.text().catch(() => '');
    console.warn('[ApiClient Diagnostic] Non-JSON or Non-API Response Encountered:', {
      method: options.method || 'GET',
      requestUrl: url,
      responseUrl: res.url,
      redirected: res.redirected,
      status: res.status,
      statusText: res.statusText,
      contentType,
      xAcApiResponse,
      bodySnippet: bodyText.slice(0, 150).replace(/\s+/g, ' ')
    });

    const code = res.status === 504 ? 'GATEWAY_TIMEOUT' : 'NON_JSON_RESPONSE';
    const message = `Phản hồi máy chủ không đúng định dạng JSON (${res.status}).`;
    throw new ApiError(code, message, true, res.status);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = data.code || (res.status === 429 ? 'GEMINI_QUOTA_EXHAUSTED' : res.status === 503 ? 'GEMINI_TEMPORARILY_UNAVAILABLE' : 'API_ERROR');
    const message = data.message || `${defaultErrorMsg} (${res.status})`;
    const retryable = data.retryable ?? (res.status === 503 || res.status === 429);
    const retryAfter = data.retryAfterSeconds;

    if (res.status === 429) {
      clientQuotaCooldownUntil = Date.now() + (retryAfter || 60) * 1000;
    }

    throw new ApiError(code, message, retryable, res.status, retryAfter);
  }

  return data as T;
}

// In-Flight Promise Dedup & Multi-Consumer Ownership Maps
interface InFlightCallEntry<T> {
  promise: Promise<T>;
  abortController: AbortController;
  activeConsumers: Map<any, () => void>;
}

const inFlightCallA = new Map<string, InFlightCallEntry<GarmentRecommendationOutput>>();
const inFlightCallB = new Map<string, InFlightCallEntry<BlueprintOutput>>();

function executeWithInFlightDedup<T>(
  inFlightMap: Map<string, InFlightCallEntry<T>>,
  cacheKey: string,
  fetchFn: (signal: AbortSignal) => Promise<T>,
  consumerSignal?: AbortSignal
): Promise<T> {
  let entry = inFlightMap.get(cacheKey);

  if (!entry) {
    const abortController = new AbortController();
    const activeConsumers = new Map<any, () => void>();

    const promise = (async () => {
      try {
        return await fetchFn(abortController.signal);
      } finally {
        for (const unregister of activeConsumers.values()) {
          try { unregister(); } catch (_) {}
        }
        activeConsumers.clear();
        inFlightMap.delete(cacheKey);
      }
    })();

    entry = { promise, abortController, activeConsumers };
    inFlightMap.set(cacheKey, entry);
  }

  // Register consumer token
  const consumerKey = consumerSignal || Symbol('consumer');
  if (consumerSignal) {
    if (consumerSignal.aborted) {
      if (entry.activeConsumers.size === 0) {
        entry.abortController.abort();
      }
    } else {
      const abortListener = () => {
        const currentEntry = inFlightMap.get(cacheKey);
        if (!currentEntry) return;
        currentEntry.activeConsumers.delete(consumerKey);
        if (currentEntry.activeConsumers.size === 0) {
          currentEntry.abortController.abort();
        }
      };
      consumerSignal.addEventListener('abort', abortListener, { once: true });
      entry.activeConsumers.set(consumerKey, () => {
        consumerSignal.removeEventListener('abort', abortListener);
      });
    }
  } else {
    entry.activeConsumers.set(consumerKey, () => {});
  }

  return entry.promise;
}

// Session Caches
const sessionRecommendationCache = new Map<string, GarmentRecommendationOutput>();
const sessionBlueprintCache = new Map<string, BlueprintOutput>();

// Client Quota Cooldown (timestamp ms)
let clientQuotaCooldownUntil = 0;

export function getClientQuotaCooldown(): number {
  const now = Date.now();
  if (now < clientQuotaCooldownUntil) {
    return Math.max(1, Math.ceil((clientQuotaCooldownUntil - now) / 1000));
  }
  return 0;
}

export function resetClientQuotaCooldown(): void {
  clientQuotaCooldownUntil = 0;
}

export function clearSessionCaches(): void {
  sessionBlueprintCache.clear();
  sessionRecommendationCache.clear();
  for (const entry of inFlightCallA.values()) {
    entry.abortController.abort();
  }
  for (const entry of inFlightCallB.values()) {
    entry.abortController.abort();
  }
  inFlightCallA.clear();
  inFlightCallB.clear();
}

export function primeSessionBlueprintCache(entries: Array<{ cacheKey: string; blueprint: BlueprintOutput }>): void {
  for (const entry of entries) {
    if (entry && entry.cacheKey && entry.blueprint) {
      sessionBlueprintCache.set(entry.cacheKey, entry.blueprint);
    }
  }
}

export function getAllSessionBlueprintEntries(): Array<{ cacheKey: string; blueprint: BlueprintOutput }> {
  const result: Array<{ cacheKey: string; blueprint: BlueprintOutput }> = [];
  for (const [cacheKey, blueprint] of sessionBlueprintCache.entries()) {
    result.push({ cacheKey, blueprint });
  }
  return result;
}

export function primeSessionRecommendationCache(entries: Array<{ cacheKey: string; recommendation: GarmentRecommendationOutput }>): void {
  for (const entry of entries) {
    if (entry && entry.cacheKey && entry.recommendation) {
      sessionRecommendationCache.set(entry.cacheKey, entry.recommendation);
    }
  }
}

/**
 * Phase 2A: Call A — Garment Recommendation
 * Rule: Only called on explicit user submit with new context.
 * In-Flight Dedup + Session Caching + Strict Error Handling (No Fake AI Fallback).
 */
export async function recommendGarment(input: {
  promptText: string;
  selectedOccasion: string;
  selectedStyle: string;
  traditionalRatio: number;
  genderPresentation?: string;
  signal?: AbortSignal;
}): Promise<GarmentRecommendationOutput> {
  const cacheKey = [
    input.promptText.trim().toLowerCase(),
    input.selectedOccasion,
    input.selectedStyle,
    input.traditionalRatio,
    input.genderPresentation || 'nam'
  ].join('|');

  // 1. Session Cache Check
  if (sessionRecommendationCache.has(cacheKey)) {
    return sessionRecommendationCache.get(cacheKey)!;
  }

  // 2. Client Quota Cooldown Check
  const cooldownSecs = getClientQuotaCooldown();
  if (cooldownSecs > 0) {
    throw new ApiError(
      'GEMINI_QUOTA_EXHAUSTED',
      'Dịch vụ AI tạm thời đã đạt giới hạn sử dụng của môi trường thử nghiệm. Bạn vẫn có thể xem lại các kết quả đã tạo trước đó.',
      false,
      429,
      cooldownSecs
    );
  }

  if (input.signal?.aborted) {
    const abortErr = new Error('Yêu cầu đã bị hủy.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  if (inFlightCallA.has(cacheKey)) {
    // In-flight dedup hit
  }

  return executeWithInFlightDedup(
    inFlightCallA,
    cacheKey,
    async (signal) => {
      const data = await fetchJsonApi<GarmentRecommendationOutput>('/api/recommend-garment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: input.promptText,
          selectedOccasion: input.selectedOccasion,
          selectedStyle: input.selectedStyle,
          traditionalRatio: input.traditionalRatio,
          genderPresentation: input.genderPresentation || 'nam'
        }),
        signal
      }, 'Lỗi yêu cầu AI');
      sessionRecommendationCache.set(cacheKey, data);
      return data;
    },
    input.signal
  );
}

/**
 * Phase 2A: Call B — Blueprint Generation
 * Rule: Only called when selectedGarmentId / context changes and not in cache.
 * In-Flight Dedup + Session Caching + Strict Error Handling (No Fake AI Fallback).
 */
export async function generateBlueprint(input: {
  selectedGarmentId: GarmentId;
  promptText: string;
  selectedOccasion: string;
  selectedStyle: string;
  traditionalRatio: number;
  genderPresentation?: string;
  signal?: AbortSignal;
}): Promise<BlueprintOutput> {
  const cacheKey = [
    input.selectedGarmentId,
    input.promptText.trim().toLowerCase(),
    input.selectedOccasion,
    input.selectedStyle,
    input.traditionalRatio,
    input.genderPresentation || 'nam'
  ].join('|');

  // 1. Session Cache Check (Switching Primary -> Alt -> Primary reuses cached data with 0 API calls)
  if (sessionBlueprintCache.has(cacheKey)) {
    return sessionBlueprintCache.get(cacheKey)!;
  }

  // 2. Client Quota Cooldown Check
  const cooldownSecs = getClientQuotaCooldown();
  if (cooldownSecs > 0) {
    throw new ApiError(
      'GEMINI_QUOTA_EXHAUSTED',
      'Dịch vụ AI tạm thời đã đạt giới hạn sử dụng của môi trường thử nghiệm. Bạn vẫn có thể xem lại các kết quả đã tạo trước đó.',
      false,
      429,
      cooldownSecs
    );
  }

  if (input.signal?.aborted) {
    const abortErr = new Error('Yêu cầu đã bị hủy.');
    abortErr.name = 'AbortError';
    throw abortErr;
  }

  // 3. In-Flight Deduplication with Ref-Counted Multi-Consumer Ownership (signal: input.signal)
  if (inFlightCallB.has(cacheKey)) {
    // Attach to existing shared in-flight entry
  }

  const payload = {
    selectedGarmentId: input.selectedGarmentId,
    promptText: input.promptText,
    selectedOccasion: input.selectedOccasion,
    selectedStyle: input.selectedStyle,
    traditionalRatio: input.traditionalRatio,
    genderPresentation: input.genderPresentation || 'nam'
  };

  return executeWithInFlightDedup(
    inFlightCallB,
    cacheKey,
    async (signal) => {
      const data = await fetchJsonApi<BlueprintOutput>('/api/generate-blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      }, 'Lỗi tạo bản phối AI');
      console.log('[BlueprintClient] BODY_PARSED', { cacheKey });
      sessionBlueprintCache.set(cacheKey, data);
      console.log('[BlueprintClient] INFLIGHT_PROMISE_RESOLVED', { cacheKey });
      return data;
    },
    input.signal
  );
}

const sessionExplorationCache = new Map<string, ExplorationBlueprintResult>();

export async function generateExplorationBlueprint(input: {
  selectedGarmentId: GarmentId;
  parentBlueprint: BlueprintOutput;
  parentOutfitFingerprint: string;
  explorationIntent: ExplorationIntent;
  context: {
    promptText: string;
    selectedOccasion: string;
    selectedStyle: string;
    traditionalRatio: number;
    genderPresentation?: string;
  };
  signal?: AbortSignal;
}): Promise<ExplorationBlueprintResult> {
  const cacheKey = [
    input.selectedGarmentId,
    input.explorationIntent,
    input.parentOutfitFingerprint,
    JSON.stringify(input.parentBlueprint),
    input.context.promptText.trim().toLowerCase(),
    input.context.selectedOccasion,
    input.context.selectedStyle,
    input.context.traditionalRatio,
    input.context.genderPresentation || 'nam'
  ].join('|');

  if (sessionExplorationCache.has(cacheKey)) {
    return sessionExplorationCache.get(cacheKey)!;
  }

  const data = await fetchJsonApi<ExplorationBlueprintResult>('/api/generate-exploration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      selectedGarmentId: input.selectedGarmentId,
      parentBlueprint: input.parentBlueprint,
      parentOutfitFingerprint: input.parentOutfitFingerprint,
      explorationIntent: input.explorationIntent,
      context: input.context
    }),
    signal: input.signal
  }, 'Không thể tạo hướng phối khám phá lúc này.');
  sessionExplorationCache.set(cacheKey, data);
  return data;
}

export function clearExplorationCache() {
  sessionExplorationCache.clear();
}

