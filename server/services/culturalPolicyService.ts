/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Cultural Product Rules v1.1 Policy Service
 * 
 * Provides deterministic runtime enforcement of approved Cultural Product Rules v1.1:
 * - Wearer compatibility for Call A Recommendation
 * - Context-aware accessory candidate filtering and post-model sanitization for Call B Blueprint
 * - Guided Exploration policy boundaries
 * - Zero extra LLM calls
 */

import {
  GarmentId,
  GenderPresentation,
  GarmentRecommendationOutput,
  BlueprintOutput
} from '../../src/types/index';
import {
  ACCESSORIES,
  CatalogItem
} from '../../src/data/canonicalCatalog';
import {
  PRODUCT_POLICY_V11,
  getTraditionalityBand
} from '../../src/data/culturalProductRulesV11';

/**
 * Checks if prompt expresses explicit user intent for contemporary reinterpretation of male áo tứ thân
 */
export function isMaleTuThanExplicitRemix(promptText?: string): boolean {
  if (!promptText) return false;
  const p = promptText.toLowerCase();
  return (
    p.includes('cách tân cho nam') ||
    p.includes('nam mặc tứ thân') ||
    p.includes('tứ thân nam') ||
    p.includes('nam giới cách tân') ||
    p.includes('nam diện tứ thân') ||
    p.includes('biến tấu nam') ||
    p.includes('reinterpretation') ||
    p.includes('gender remix') ||
    p.includes('unisex') ||
    p.includes('nam phá cách') ||
    p.includes('editorial cho nam')
  );
}

/**
 * Checks if user prompt explicitly requests a fan (unambiguous fan request).
 * Cultural Product Rules v1.1 §8: Handheld fan is EXPLICIT_ONLY.
 * Must NOT become available merely because traditionalRatio matches or context fits.
 */
export function isFanRequestedExplicitly(promptText?: string): boolean {
  if (!promptText) return false;
  const p = promptText.toLowerCase();

  // Negative checks: user explicitly refuses fan
  if (
    p.includes('không quạt') ||
    p.includes('không dùng quạt') ||
    p.includes('không cầm quạt') ||
    p.includes('không có quạt') ||
    p.includes('tránh quạt') ||
    /\bno\s+fan\b/i.test(p) ||
    /\bwithout\s+(a\s+)?fan\b/i.test(p)
  ) {
    return false;
  }

  // Explicit positive request
  return (
    p.includes('quạt') ||
    /\b(handheld[\s-]fan|folding[\s-]fan|paper[\s-]fan|fans?)\b/i.test(p)
  );
}

/**
 * Checks if user prompt explicitly requests a pearl necklace.
 * Cultural Product Rules v1.1 §8: Pearl necklace is EXPLICIT_ONLY.
 * Must NOT become available as an automatic historical default.
 */
export function isPearlRequestedExplicitly(promptText?: string): boolean {
  if (!promptText) return false;
  const p = promptText.toLowerCase();

  // Negative checks
  if (
    p.includes('không ngọc trai') ||
    p.includes('không dùng ngọc trai') ||
    p.includes('không đeo ngọc trai') ||
    p.includes('tránh ngọc trai') ||
    /\bno\s+pearls?\b/i.test(p) ||
    /\bwithout\s+pearls?\b/i.test(p)
  ) {
    return false;
  }

  return (
    p.includes('ngọc trai') ||
    p.includes('chuỗi ngọc') ||
    p.includes('vòng ngọc') ||
    /\bpearls?\b/i.test(p)
  );
}

export const TRADITIONAL_HEADWEAR_IDS = [
  'khan_dong_truyen_thong',
  'khan_mo_qua',
  'non_thung_quai_thao'
] as const;

/**
 * Checks if user prompt explicitly requests a hairpin / trâm cài tóc.
 * Trâm cài tóc tối giản is a CONTEMPORARY_STYLING_RECOMMENDATION.
 */
export function isHairpinRequestedExplicitly(promptText?: string): boolean {
  if (!promptText) return false;
  const p = promptText.toLowerCase();

  // Negative checks
  if (
    p.includes('không trâm') ||
    p.includes('không cài trâm') ||
    p.includes('không dùng trâm') ||
    p.includes('tránh trâm') ||
    /\bno\s+hairpins?\b/i.test(p) ||
    /\bwithout\s+hairpins?\b/i.test(p)
  ) {
    return false;
  }

  return (
    p.includes('trâm') ||
    p.includes('cài tóc') ||
    /\bhairpins?\b/i.test(p)
  );
}

/**
 * Validates and enforces Wearer Compatibility Matrix for Call A Recommendation
 * 
 * Invariants (Cultural Product Rules v1.1 §3, §12):
 * - ngu_than_chen: male (DOCUMENTED), female (DOCUMENTED) -> auto-eligible
 * - ao_tac: male (DOCUMENTED), female (DOCUMENTED) -> auto-eligible for ceremonial/formal
 * - ao_tu_than:
 *   - female: DOCUMENTED -> auto-eligible
 *   - male: NOT_ESTABLISHED in historical canonical corpus -> DO NOT auto-recommend as historical male dress.
 *     Allow ONLY when explicit contemporary reinterpretation is requested.
 *     When allowed, rationale MUST label it as contemporary reinterpretation.
 * - Deterministic post-model validation:
 *   If model primary violates eligibility, swap to valid alternative or best policy-valid garment without creating new AI calls.
 */
export function validateAndEnforceRecommendationPolicy(
  result: GarmentRecommendationOutput,
  context: {
    wearer: GenderPresentation;
    occasion?: string;
    style?: string;
    traditionalRatio?: number;
    promptText?: string;
  }
): GarmentRecommendationOutput {
  const wearer = context.wearer || 'nam';
  const prompt = (context.promptText || '').toLowerCase();
  const occasion = context.occasion || 'tet';
  const ratio = typeof context.traditionalRatio === 'number' ? context.traditionalRatio : 50;

  let primary = { ...result.primary };
  let alternative = result.alternative ? { ...result.alternative } : null;

  // RULE 1: Explicit Male Wearer + Áo tứ thân check (BLOCKED in grounded MVP corpus)
  if (wearer === 'nam') {
    if (primary.garmentId === 'ao_tu_than') {
      if (alternative && (alternative.garmentId === 'ngu_than_chen' || alternative.garmentId === 'ao_tac')) {
        primary = {
          garmentId: alternative.garmentId,
          rationale: alternative.rationale || (
            alternative.garmentId === 'ao_tac'
              ? 'Áo tấc (Ngũ thân tay thụng) là lễ phục truyền thống mực thước, trang trọng và có chứng cứ lịch sử xác thực cho nam giới.'
              : 'Áo ngũ thân tay chẽn là cấu hình tiện phục mực thước, di chuyển linh hoạt và có chứng cứ lịch sử xác thực cho nam giới.'
          )
        };
        alternative = null;
      } else {
        const isCeremonial = occasion === 'tet_temple' || occasion === 'cultural_wedding' || occasion === 'tet';
        if (isCeremonial) {
          primary = {
            garmentId: 'ao_tac',
            rationale: 'Áo tấc (Ngũ thân tay thụng) là lễ phục truyền thống mực thước, trang trọng và có chứng cứ lịch sử xác thực cho nam giới trong các dịp lễ nghi.'
          };
          alternative = {
            garmentId: 'ngu_than_chen',
            rationale: 'Áo ngũ thân tay chẽn là phương án thường phục gọn gàng, năng động và giàu bản sắc cho nam giới.'
          };
        } else {
          primary = {
            garmentId: 'ngu_than_chen',
            rationale: 'Áo ngũ thân tay chẽn là cấu hình tiện phục mực thước, di chuyển linh hoạt và có chứng cứ lịch sử xác thực cho nam giới.'
          };
          alternative = {
            garmentId: 'ao_tac',
            rationale: 'Áo tấc là lựa chọn bổ trợ nếu bạn muốn tăng thêm tính trang nghiêm cho buổi gặp gỡ.'
          };
        }
      }
    }

    // Sanitize alternative for male wearer if it is ao_tu_than
    if (alternative && alternative.garmentId === 'ao_tu_than') {
      alternative = primary.garmentId === 'ao_tac'
        ? {
            garmentId: 'ngu_than_chen',
            rationale: 'Áo ngũ thân tay chẽn là lựa chọn bổ trợ năng động, gọn gàng và phù hợp lịch sử cho nam giới.'
          }
        : {
            garmentId: 'ao_tac',
            rationale: 'Áo tấc là lựa chọn bổ trợ trang trọng hơn cho các nghi lễ quan trọng.'
          };
    }
  }

  // RULE 2: Neutral Wearer + Áo tứ thân check
  // neutral means user has no presentation preference, not historical gender-neutrality.
  // For traditional-leaning Northern/Kinh ao_tu_than, documented female profile remains default unless explicit male remix.
  if (wearer === 'neutral' && primary.garmentId === 'ao_tu_than') {
    if (!primary.rationale.includes('nữ') && !primary.rationale.includes('Bắc Bộ')) {
      primary.rationale = `${primary.rationale} (Dựa trên hồ sơ trang phục truyền thống phụ nữ Bắc Bộ).`;
    }
  }

  // RULE 3: Áo tấc in casual/street context check
  // Do not prefer ao_tac for ordinary casual/street use when functionally better garment exists (unless user explicitly requests it).
  const isCasualStreet = occasion === 'street_cafe' || prompt.includes('dạo phố') || prompt.includes('cà phê');
  const userAskedForAoTac = prompt.includes('áo tấc') || prompt.includes('tay thụng');
  if (isCasualStreet && ratio >= 60 && !userAskedForAoTac && primary.garmentId === 'ao_tac') {
    if (alternative && alternative.garmentId === 'ngu_than_chen') {
      // Swap: prefer ngu_than_chen for casual street
      const temp = primary;
      primary = alternative;
      alternative = temp;
    }
  }

  return { primary, alternative };
}

/**
 * Returns policy-compatible accessories based on garment, wearer, occasion, style, traditionality band
 * 
 * Rules (Cultural Product Rules v1.1 §4, §6, §7, §8):
 * - NO generic global accessory pool.
 * - Hairpin (trâm): Do NOT infer female -> hairpin. No automatic default.
 * - Jade pendant (ngọc bội): Do NOT infer male + ao_tac -> jade pendant (court/elite only).
 * - Pearl necklace: Never historical default. Contemporary/editorial only (maxTraditionalRatio <= 39).
 * - Handheld fan: Contemporary/editorial reinterpretation; not universal default (maxTraditionalRatio <= 59).
 * - Headwear (khăn đóng): Male only for ao_tac & ngu_than_chen. For female, do NOT incorrectly map khan_dong. Prefer NO headwear.
 * - Northern female tứ thân: Khăn mỏ quạ & nón thúng quai thao allowed for female, but supporting, not mandatory.
 * - Core fallback: No approved compatible accessory -> return [] (prefer no accessory over invention).
 */
export function getPolicyCompatibleAccessories(params: {
  garmentId: GarmentId;
  wearer: GenderPresentation;
  occasion?: string;
  style?: string;
  traditionalRatio: number;
  promptText?: string;
  isExploration?: boolean;
  explorationIntent?: string;
}): CatalogItem[] {
  const { garmentId, wearer, traditionalRatio, promptText, explorationIntent } = params;
  const p = (promptText || '').toLowerCase();

  // Negative constraints: user explicitly requested no accessories
  if (
    p.includes('không phụ kiện') ||
    p.includes('không dùng phụ kiện') ||
    p.includes('không có phụ kiện') ||
    p.includes('no accessories')
  ) {
    return [];
  }

  const effectiveWearer = wearer || 'nam';
  const band = getTraditionalityBand(traditionalRatio);

  const compatible: CatalogItem[] = [];

  for (const item of ACCESSORIES) {
    let isAllowed = false;

    switch (item.id) {
      case 'khan_dong_truyen_thong':
        // Headwear: In v1.1, khan_dong_male is supported for male with ao_tac & ngu_than_chen.
        // For female: Catalog lacks safe distinct female khăn vấn, so prefer NO headwear over incorrect mapping!
        // Never allowed for ao_tu_than!
        if (effectiveWearer === 'nam' && (garmentId === 'ao_tac' || garmentId === 'ngu_than_chen')) {
          if (traditionalRatio >= 50 && explorationIntent !== 'MORE_REMIXED') {
            isAllowed = true;
          }
        }
        break;

      case 'khan_mo_qua':
        // Northern female áo tứ thân only.
        if (garmentId === 'ao_tu_than' && (effectiveWearer === 'nu' || effectiveWearer === 'neutral')) {
          if (traditionalRatio >= 50) {
            isAllowed = true;
          }
        }
        break;

      case 'non_thung_quai_thao':
        // Northern female áo tứ thân only.
        if (garmentId === 'ao_tu_than' && (effectiveWearer === 'nu' || effectiveWearer === 'neutral')) {
          if (traditionalRatio >= 50) {
            isAllowed = true;
          }
        }
        break;

      case 'tui_coton_theu_tay':
        // Modern minimal bag: SAFE_CONTEMPORARY, maxTraditionalRatio: 69.
        // Do not include if user requests strictly traditional (MORE_TRADITIONAL)
        if (traditionalRatio <= 69 && explorationIntent !== 'MORE_TRADITIONAL') {
          isAllowed = true;
        }
        break;

      case 'kinh_ram_gong_tron':
        // Modern minimal eyewear: SAFE_CONTEMPORARY, maxTraditionalRatio: 69.
        if (traditionalRatio <= 69 && explorationIntent !== 'MORE_TRADITIONAL') {
          isAllowed = true;
        }
        break;

      case 'vong_bac_cham_hoa':
        // Traditional / contemporary silver torque (kiềng bạc).
        // Appropriate across garments when traditionalRatio is balanced or traditional
        if (traditionalRatio >= 40) {
          isAllowed = true;
        }
        break;

      case 'quat_giay_tram_huong': {
        // Handheld fan: CONTEMPORARY_REINTERPRETATION, maxTraditionalRatio: 59, EXPLICIT_ONLY.
        // Cultural Product Rules v1.1 §8: Current corpus does not support it as a universal historical default.
        // Traditionality threshold alone must NEVER unlock the fan.
        // Allowed ONLY when:
        // 1. Explicitly requested by user in prompt (fanRequestedExplicitly)
        // 2. Context is policy-compatible (traditionalRatio <= 59 && explorationIntent !== 'MORE_TRADITIONAL')
        const fanExplicit = isFanRequestedExplicitly(promptText);
        if (fanExplicit && traditionalRatio <= 59 && explorationIntent !== 'MORE_TRADITIONAL') {
          isAllowed = true;
        }
        break;
      }

      case 'chuoi_ngoc_trai_co': {
        // Pearl necklace: CONTEMPORARY_REINTERPRETATION, maxTraditionalRatio: 39, EXPLICIT_ONLY.
        // Strictly forbidden as historical default.
        // Allowed ONLY when:
        // 1. Explicitly requested by user in prompt (pearlRequestedExplicitly)
        // 2. Compatible contemporary/editorial context (traditionalRatio <= 39 && explorationIntent !== 'MORE_TRADITIONAL')
        const pearlExplicit = isPearlRequestedExplicitly(promptText);
        if (pearlExplicit && traditionalRatio <= 39 && explorationIntent !== 'MORE_TRADITIONAL') {
          isAllowed = true;
        }
        break;
      }

      case 'tram_cai_toc_toi_gian': {
        // Minimalist hairpin: CONTEMPORARY_STYLING_RECOMMENDATION
        // - Optional contemporary styling accessory, never a historical default for any MVP garment
        // - Compatible when traditionalRatio <= 69 and explorationIntent !== 'MORE_TRADITIONAL'
        // - Allowed when user explicitly requests it, or for female/neutral in contemporary-leaning contexts
        const hairpinExplicit = isHairpinRequestedExplicitly(promptText);
        if (hairpinExplicit) {
          isAllowed = true;
        } else if ((effectiveWearer === 'nu' || effectiveWearer === 'neutral') && traditionalRatio <= 69 && explorationIntent !== 'MORE_TRADITIONAL') {
          isAllowed = true;
        }
        break;
      }

      default:
        isAllowed = false;
        break;
    }

    if (isAllowed) {
      compatible.push(item);
    }
  }

  return compatible;
}

/**
 * Sanitizes blueprint output strictly against policy-compatible items
 */
export function sanitizeBlueprintWithPolicy(
  garmentId: GarmentId,
  output: any,
  promptText?: string,
  policyContext?: {
    wearer: GenderPresentation;
    occasion?: string;
    style?: string;
    traditionalRatio: number;
    explorationIntent?: string;
  }
): {
  allowedAccessories: CatalogItem[];
  sanitizedAccessoryIds: string[];
} {
  const wearer = policyContext?.wearer || 'nam';
  const ratio = typeof policyContext?.traditionalRatio === 'number' ? policyContext.traditionalRatio : 50;

  const allowedAccessories = getPolicyCompatibleAccessories({
    garmentId,
    wearer,
    occasion: policyContext?.occasion,
    style: policyContext?.style,
    traditionalRatio: ratio,
    promptText,
    explorationIntent: policyContext?.explorationIntent
  });

  const allowedIds = new Set(allowedAccessories.map(a => a.id));

  const proposal = output?.remixProposal || {};
  let rawAccessoryIds: string[] = Array.isArray(proposal.accessoryIds) ? proposal.accessoryIds : [];

  const p = (promptText || '').toLowerCase();
  if (
    p.includes('không phụ kiện') ||
    p.includes('không dùng phụ kiện') ||
    p.includes('không có phụ kiện') ||
    p.includes('no accessories')
  ) {
    return {
      allowedAccessories,
      sanitizedAccessoryIds: []
    };
  }

  // Filter raw accessories so only policy-allowed items survive
  let sanitizedAccessoryIds = rawAccessoryIds
    .filter(id => typeof id === 'string' && allowedIds.has(id))
    .slice(0, 2);

  // Headwear conflict guard:
  // Traditional headwear (khan_dong, khan_mo_qua, non_thung_quai_thao) and hairpin cannot co-exist!
  const hasHeadwear = sanitizedAccessoryIds.some(id => TRADITIONAL_HEADWEAR_IDS.includes(id as any));
  const hasHairpin = sanitizedAccessoryIds.includes('tram_cai_toc_toi_gian');
  if (hasHeadwear && hasHairpin) {
    if (isHairpinRequestedExplicitly(promptText)) {
      // User explicitly requested hairpin: prioritize hairpin, drop headwear
      sanitizedAccessoryIds = sanitizedAccessoryIds.filter(id => !TRADITIONAL_HEADWEAR_IDS.includes(id as any));
    } else {
      // Auto-suggestion: headwear takes precedence, drop hairpin
      sanitizedAccessoryIds = sanitizedAccessoryIds.filter(id => id !== 'tram_cai_toc_toi_gian');
    }
  }

  return {
    allowedAccessories,
    sanitizedAccessoryIds
  };
}

/**
 * Normalizes explicit user prop requests or approved system suggestions into canonical ContextProp objects
 */
export function extractContextPropsFromPrompt(promptText?: string, occasion?: string): import('../../src/types/index').ContextProp[] {
  if (!promptText) return [];
  const props: import('../../src/types/index').ContextProp[] = [];
  const p = (promptText || '').toLowerCase();

  // 1. Coca-Cola / Beverage Can (Explicit User Request)
  if (p.includes('coca') || p.includes('pepsi') || p.includes('lon nước ngọt') || p.includes('lon bia')) {
    props.push({
      type: 'handheld',
      description: 'lon Coca-Cola phiên bản Tết',
      source: 'explicit_user_request',
      contextFit: 'context_sensitive'
    });
  }

  // 2. Red Envelopes / Bao Lì Xì
  if (p.includes('lì xì') || p.includes('bao lì xì') || p.includes('red envelope')) {
    props.push({
      type: 'handheld',
      description: 'xấp bao lì xì đỏ may mắn ngày Tết',
      source: 'explicit_user_request',
      contextFit: 'appropriate'
    });
  }

  // 3. Peach / Apricot Blossom Branch (Handheld or Scene)
  if (p.includes('hoa đào') || p.includes('cành đào') || p.includes('hoa mai') || p.includes('cành mai')) {
    props.push({
      type: 'handheld',
      description: 'cành hoa xuân truyền thống (đào/mai)',
      source: 'explicit_user_request',
      contextFit: 'appropriate'
    });
  }

  // 4. Books / Scrolls
  if (p.includes('cuốn sách') || p.includes('trục thư') || p.includes('sách cổ')) {
    props.push({
      type: 'handheld',
      description: 'cuốn sách bìa nhã nhặn',
      source: 'explicit_user_request',
      contextFit: 'appropriate'
    });
  }

  // 5. Cameras
  if (p.includes('máy ảnh') || p.includes('camera')) {
    props.push({
      type: 'handheld',
      description: 'máy ảnh du lịch cổ điển',
      source: 'explicit_user_request',
      contextFit: 'context_sensitive'
    });
  }

  return props;
}
