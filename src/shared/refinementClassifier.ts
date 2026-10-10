/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * User-Guided Refinement Request Classifier
 *
 * Classifies user-guided refinement text into one of three categories:
 * 1. IMAGE_ONLY_ALLOWED: Image-level rendering adjustments (lighting, pose, angle, drape, background, photo tone)
 * 2. STRUCTURAL_CONTRADICTION: Requests that attempt to mutate or remove protected traditional garment structural traits (collars, sleeves, lapels, buttons/closures, yếm)
 * 3. BLUEPRINT_MUTATION_REQUIRED: Requests that attempt to change Blueprint configuration attributes (garment type, palette, fabric, lower garment, footwear, wearable accessories)
 */

import { PALETTES } from '../data/canonicalCatalog';

export type RefinementClassificationCategory =
  | 'IMAGE_ONLY_ALLOWED'
  | 'STRUCTURAL_CONTRADICTION'
  | 'BLUEPRINT_MUTATION_REQUIRED';

export type RefinementBlockedAction =
  | 'CHANGE_COLOR'
  | 'CHANGE_GARMENT'
  | 'CHANGE_FABRIC'
  | 'CHANGE_ACCESSORY';

export interface BlockedClauseItem {
  text: string;
  category: RefinementClassificationCategory;
  suggestedAction?: RefinementBlockedAction;
  suggestedColorId?: string;
  reason?: string;
}

export interface RefinementClassificationResult {
  category: RefinementClassificationCategory;
  allowed: boolean; // true ONLY for IMAGE_ONLY_ALLOWED
  title: string;
  reason: string;
  guidance: string;
  changes?: string[];
  preserved?: string[];
  // New optional fields for multi-clause breakdown and actionable recovery:
  allowedClauses?: string[];
  blockedClauses?: BlockedClauseItem[];
  suggestedColorId?: string;
}

/**
 * Protected compound allowlist.
 * Phrases here must NEVER be treated as garment parts (cổ, tà, vạt, cúc, khuy).
 */
export const PROTECTED_COMPOUNDS: readonly string[] = [
  'cổ điển',
  'cổ truyền',
  'cổ phục',
  'cổ tay',
  'cổ chân',
  'tà dương',
  'tàn nhang',
  'vạt nắng',
  'vạt sáng',
  'cúc họa mi',
  'hoa cúc'
];

/**
 * Match a Vietnamese color name in text to a canonical palette ID from PALETTES.
 */
export function extractSuggestedColorId(text: string): string | undefined {
  const normalized = text.normalize('NFC').toLowerCase();
  
  // Specific multi-word color mappings first
  if (/(đỏ\s*son|đỏ\s*trầm|màu\s*đỏ\s*son)/u.test(normalized)) return 'do_son_tram';
  if (/(vàng\s*hoàng\s*cúc|vàng\s*cúc)/u.test(normalized)) return 'vang_hoang_cuc';
  if (/(chàm\s*cổ|xanh\s*chàm)/u.test(normalized)) return 'xanh_cham_co';
  if (/(ngọc\s*bích|xanh\s*ngọc)/u.test(normalized)) return 'xanh_ngoc_bich';
  if (/(thiên\s*thanh|xanh\s*da\s*trời|xanh\s*nhạt)/u.test(normalized)) return 'xanh_thien_thanh';
  if (/(sen\s*phấn|cánh\s*sen|hồng\s*sen)/u.test(normalized)) return 'hong_canh_sen';
  if (/(hoa\s*cà|tím\s*huế|tím\s*cà)/u.test(normalized)) return 'tim_hue_hoa_ca';
  if (/(trắng\s*ngà|bạch\s*ngọc|trắng\s*sữa)/u.test(normalized)) return 'trang_nga_bach_ngoc';
  if (/(đen\s*tuyền|đen\s*nhánh)/u.test(normalized)) return 'den_tuyen';
  if (/(be\s*mộc|màu\s*be|đũi\s*mộc)/u.test(normalized)) return 'be_moc_linen';

  // Broader base color mapping
  if (/(?<![\p{L}\p{N}])đỏ(?![\p{L}\p{N}])/u.test(normalized)) return 'do_son_tram';
  if (/(?<![\p{L}\p{N}])vàng(?![\p{L}\p{N}])/u.test(normalized)) return 'vang_hoang_cuc';
  if (/(?<![\p{L}\p{N}])đen(?![\p{L}\p{N}])/u.test(normalized)) return 'den_tuyen';
  if (/(?<![\p{L}\p{N}])trắng(?![\p{L}\p{N}])/u.test(normalized)) return 'trang_nga_bach_ngoc';
  if (/(?<![\p{L}\p{N}])hồng(?![\p{L}\p{N}])/u.test(normalized)) return 'hong_canh_sen';
  if (/(?<![\p{L}\p{N}])tím(?![\p{L}\p{N}])/u.test(normalized)) return 'tim_hue_hoa_ca';
  if (/(?<![\p{L}\p{N}])(be|nâu\s*nhạt)(?![\p{L}\p{N}])/u.test(normalized)) return 'be_moc_linen';
  // "xanh" alone is ambiguous; default to xanh_cham_co or xanh_thien_thanh based on context
  if (/(?<![\p{L}\p{N}])xanh(?![\p{L}\p{N}])/u.test(normalized)) {
    if (/(xanh\s*đậm|xanh\s*tối|chàm)/u.test(normalized)) return 'xanh_cham_co';
    return 'xanh_thien_thanh';
  }

  return undefined;
}

interface ClauseClassification {
  text: string;
  category: RefinementClassificationCategory;
  reason?: string;
  suggestedAction?: RefinementBlockedAction;
  suggestedColorId?: string;
}

/**
 * Classifies an individual clause after compound masking and negation analysis.
 */
function classifySingleClause(rawClause: string, garmentId?: string): ClauseClassification {
  const clause = rawClause.trim();
  const lower = clause.normalize('NFC').toLowerCase();

  // 1. Mask protected compounds so non-garment terms ("cổ điển", "tà dương"...) don't trigger structural match
  let masked = lower;
  for (const compound of PROTECTED_COMPOUNDS) {
    const regex = new RegExp(`(?<![\\p{L}\\p{N}])${compound}(?![\\p{L}\\p{N}])`, 'gu');
    masked = masked.replace(regex, match => ' '.repeat(match.length));
  }

  // 2. Check negation/preservation:
  // A removal verb under negation (e.g., "đừng xóa cổ", "không cắt tà") or preservation (e.g., "giữ nguyên cổ áo") is NOT a violation.
  const hasNegatedRemoval =
    /(?<![\p{L}\p{N}])(?:đừng|không(?:\s+được)?|chớ|tránh|cấm|giữ(?:\s+nguyên)?|bảo\s+toàn|bảo\s+lưu)\s+(?:có\s+)?(?:phần\s+)?(?:xóa|bỏ|cắt|thay\s+đổi|triệt\s+tiêu|làm\s+mất)\s*(?:phần\s*)?(?:cổ|tà|vạt|khuy|cúc|yếm|tay\s*chẽn|tay\s*thụng)/u.test(lower) ||
    /(?<![\p{L}\p{N}])(?:giữ(?:\s+nguyên)?|bảo\s+toàn|bảo\s+lưu)\s*(?:phần\s*)?(?:cổ|tà|vạt|khuy|cúc|yếm|tay\s*chẽn|tay\s*thụng)/u.test(lower);

  // -------------------------------------------------------------------------
  // A. Check Structural Contradiction
  // -------------------------------------------------------------------------

  // A1. Collar removal / modification
  const collarRemoval = /(?<![\p{L}\p{N}])(xóa|bỏ|bỏ\s*bớt|không\s*cần|cắt|cắt\s*bớt|không\s*có|triệt\s*tiêu|loại\s*bỏ|thay\s*đổi|sửa)\s*(?:phần\s*)?(cổ|cổ\s*áo|cổ\s*lập\s*lĩnh|cổ\s*đứng)(?![\p{L}\p{N}])/u;
  const directCollarRemoval = /(?<![\p{L}\p{N}])(cổ\s*áo\s*(?:đi|ra|mất)|bỏ\s*cổ|xóa\s*cổ)(?![\p{L}\p{N}])/u;

  // A2. Tail / Lapel / Buttons / Closures
  const tailPanelRemoval = /(?<![\p{L}\p{N}])(xóa|bỏ|cắt|triệt\s*tiêu)\s*(?:phần\s*)?(tà|vạt|tà\s*áo|vạt\s*áo|5\s*tà|4\s*tà|khuy|khuy\s*cài|cúc|cúc\s*cài)(?![\p{L}\p{N}])/u;
  const generalStructuralRemoval = /(?<![\p{L}\p{N}])(xóa|bỏ|thay\s*đổi)\s*(?:cấu\s*trúc|kết\s*cấu|dáng\s*áo\s*nền)(?![\p{L}\p{N}])/u;

  // A3. Sleeve geometry mutations
  let sleeveContradiction = false;
  let sleeveReason = '';
  if (garmentId === 'ngu_than_chen') {
    const wantsWideSleeves = /(?<![\p{L}\p{N}])(tay\s*thụng|tay\s*rộng|chuyển\s*thành\s*tay\s*thụng|thành\s*tay\s*thụng)(?![\p{L}\p{N}])/u.test(masked);
    const explicitlyDeletesTayChen = /(?<![\p{L}\p{N}])(xóa\s*tay\s*chẽn|bỏ\s*tay\s*chẽn)(?![\p{L}\p{N}])/u.test(masked);
    const preservesTayChen = /(?<![\p{L}\p{N}])(không\s*(?:được\s*)?xóa\s*tay\s*chẽn|giữ\s*(?:nguyên\s*)?tay\s*chẽn|bảo\s*toàn\s*tay\s*chẽn|không\s*bỏ\s*tay\s*chẽn)(?![\p{L}\p{N}])/u.test(lower);

    if ((wantsWideSleeves || explicitlyDeletesTayChen) && !preservesTayChen) {
      sleeveContradiction = true;
      sleeveReason = 'Yêu cầu mở rộng hoặc chuyển sang tay thụng xung đột với kết cấu Áo ngũ thân tay chẽn.';
    }
  } else if (garmentId === 'ao_tac') {
    if (/(?<![\p{L}\p{N}])(tay\s*chẽn|bóp\s*ống\s*tay|thu\s*hẹp\s*ống\s*tay|xóa\s*tay\s*thụng|bỏ\s*tay\s*thụng|thành\s*tay\s*chẽn)(?![\p{L}\p{N}])/u.test(masked)) {
      if (!hasNegatedRemoval) {
        sleeveContradiction = true;
        sleeveReason = 'Yêu cầu bóp hẹp hoặc chuyển sang tay chẽn xung đột với kết cấu Áo tấc (ngũ thân tay thụng).';
      }
    }
  } else if (garmentId === 'ao_tu_than') {
    if (/(?<![\p{L}\p{N}])(xóa\s*yếm|bỏ\s*yếm|bỏ\s*4\s*tà|xóa\s*tà|may\s*liền\s*tà)(?![\p{L}\p{N}])/u.test(masked)) {
      if (!hasNegatedRemoval) {
        sleeveContradiction = true;
        sleeveReason = 'Yêu cầu loại bỏ yếm hoặc biến đổi 4 tà xung đột với kết cấu Áo tứ thân.';
      }
    }
  }

  // Structural checks on masked text:
  const isStructuralRemoval =
    collarRemoval.test(masked) ||
    directCollarRemoval.test(masked) ||
    tailPanelRemoval.test(masked) ||
    generalStructuralRemoval.test(masked);

  if ((isStructuralRemoval && !hasNegatedRemoval) || sleeveContradiction) {
    return {
      text: clause,
      category: 'STRUCTURAL_CONTRADICTION',
      reason: sleeveReason || 'Yêu cầu loại bỏ hoặc thay đổi cấu trúc cốt lõi (cổ áo/ống tay/tà áo/khuy cài/yếm) vi phạm quy chế nhận diện trang phục cổ truyền đã khóa.'
    };
  }

  // -------------------------------------------------------------------------
  // B. Check Blueprint Mutation Required
  // -------------------------------------------------------------------------

  // B1. Garment switching
  if (/(?<![\p{L}\p{N}])(đổi|chuyển|thay)\s*(?:sang|thành)?\s*(áo\s*tấc|áo\s*tứ\s*thân|áo\s*ngũ\s*thân|áo\s*dài)(?![\p{L}\p{N}])/u.test(masked)) {
    return {
      text: clause,
      category: 'BLUEPRINT_MUTATION_REQUIRED',
      suggestedAction: 'CHANGE_GARMENT',
      reason: 'Thao tác đổi dáng áo nền thuộc phạm vi lựa chọn mẫu áo (Section 1).'
    };
  }

  // B2. Garment color vs Image color
  // Image-level colors: màu nền, màu ánh sáng, tông ảnh, màu phông -> allow!
  const isImageLevelColor = /(?<![\p{L}\p{N}])(màu\s*nền|nền|màu\s*ánh\s*sáng|ánh\s*sáng|tông\s*ảnh|tông\s*màu|màu\s*phông|phông\s*nền)(?![\p{L}\p{N}])/u.test(lower);
  const isGarmentColorExplicit = /(?<![\p{L}\p{N}])(màu\s*áo|màu\s*chủ\s*đạo|màu\s*trang\s*phục|bảng\s*màu\s*áo|sắc\s*độ\s*áo)(?![\p{L}\p{N}])/u.test(lower);
  const isDirectGarmentColor = /(?<![\p{L}\p{N}])(thành\s*màu|sang\s*màu)\s*(đỏ|xanh|vàng|trắng|đen|tím|hồng|cam|nâu|xám)(?![\p{L}\p{N}])/u.test(lower);
  const isGeneralColorMutation = /(?<![\p{L}\p{N}])(đổi|thay|chuyển)\s*(màu|bảng\s*màu|sắc\s*độ)(?![\p{L}\p{N}])/u.test(lower);

  if (!isImageLevelColor && (isGarmentColorExplicit || (isGeneralColorMutation && !isImageLevelColor) || isDirectGarmentColor)) {
    const suggestedColorId = extractSuggestedColorId(lower);
    return {
      text: clause,
      category: 'BLUEPRINT_MUTATION_REQUIRED',
      suggestedAction: 'CHANGE_COLOR',
      suggestedColorId,
      reason: 'Bảng màu trang phục thuộc phạm vi cấu hình Bản phối (Blueprint).'
    };
  }

  // B3. Fabric mutation
  if (/(?<![\p{L}\p{N}])(đổi|thay|chuyển)\s*(chất\s*liệu|vải|sang\s*gấm|sang\s*lụa|sang\s*tơ)(?![\p{L}\p{N}])/u.test(masked)) {
    return {
      text: clause,
      category: 'BLUEPRINT_MUTATION_REQUIRED',
      suggestedAction: 'CHANGE_FABRIC',
      reason: 'Chất liệu vải thuộc phạm vi cấu hình Bản phối (Blueprint).'
    };
  }

  // B4. Lower garment / Footwear / Wearable accessories mutation
  if (/(?<![\p{L}\p{N}])(đổi|thay|đeo\s*thêm)\s*(quần|váy|giày|dép|khăn\s*đóng|kính|mũ|túi|trang\s*sức)(?![\p{L}\p{N}])/u.test(masked)) {
    return {
      text: clause,
      category: 'BLUEPRINT_MUTATION_REQUIRED',
      suggestedAction: 'CHANGE_ACCESSORY',
      reason: 'Hạ phục, giày dép và phụ kiện thuộc phạm vi cấu hình Bản phối (Blueprint).'
    };
  }

  // -------------------------------------------------------------------------
  // C. Default: Image-Only Allowed
  // -------------------------------------------------------------------------
  return {
    text: clause,
    category: 'IMAGE_ONLY_ALLOWED'
  };
}

export function classifyRefinementInput(
  refinementText: string,
  garmentId?: string
): RefinementClassificationResult {
  const text = refinementText.trim();
  if (!text || text.length < 3) {
    return {
      category: 'IMAGE_ONLY_ALLOWED',
      allowed: false,
      title: 'Mô tả quá ngắn',
      reason: 'Vui lòng mô tả điều bạn muốn chỉnh bằng ít nhất 3 ký tự.',
      guidance: 'Hãy nhập mô tả về ánh sáng, góc chụp, dáng đứng hoặc phong thái.'
    };
  }

  const normalized = text.normalize('NFC');

  // Split input into clauses on: , ; . ! và nhưng rồi đồng thời
  const rawClauses = normalized
    .split(/[,;.!]|(?<=\s)(?:và|nhưng|rồi|đồng\s+thời)(?=\s)/u)
    .map(c => c.trim())
    .filter(c => c.length > 0);

  // If splitting produced no clauses, fallback to full text
  const clauses = rawClauses.length > 0 ? rawClauses : [normalized];

  const clauseResults: ClauseClassification[] = clauses.map(c =>
    classifySingleClause(c, garmentId)
  );

  const allowedClauses: string[] = [];
  const blockedClauses: BlockedClauseItem[] = [];

  for (const cr of clauseResults) {
    if (cr.category === 'IMAGE_ONLY_ALLOWED') {
      allowedClauses.push(cr.text);
    } else {
      blockedClauses.push({
        text: cr.text,
        category: cr.category,
        suggestedAction: cr.suggestedAction,
        suggestedColorId: cr.suggestedColorId,
        reason: cr.reason
      });
    }
  }

  // Overall result aggregation
  const hasStructuralBlock = blockedClauses.some(b => b.category === 'STRUCTURAL_CONTRADICTION');
  const hasBlueprintBlock = blockedClauses.some(b => b.category === 'BLUEPRINT_MUTATION_REQUIRED');
  const primarySuggestedColor = blockedClauses.find(b => b.suggestedColorId)?.suggestedColorId || extractSuggestedColorId(normalized);

  // Case 1: Fully Allowed (all clauses valid image-level adjustments)
  if (blockedClauses.length === 0) {
    const lower = normalized.toLowerCase();
    const changes: string[] = [text];
    if (/(sáng|ánh\s*sáng|tối|ấm|lạnh|rực\s*rỡ)/i.test(lower)) {
      changes.push('Điều chỉnh hiệu ứng ánh sáng & sắc độ theo yêu cầu.');
    }
    if (/(bố\s*cục|góc|chụp|dáng\s*đứng|nghiêng|toàn\s*thân|cận\s*cảnh)/i.test(lower)) {
      changes.push('Tinh chỉnh góc chụp, bố cục và dáng đứng người mẫu.');
    }
    if (/(vải|rủ|nếp|mềm)/i.test(lower)) {
      changes.push('Điều chỉnh độ rủ tự nhiên của vạt vải.');
    }

    return {
      category: 'IMAGE_ONLY_ALLOWED',
      allowed: true,
      title: 'Phương án tinh chỉnh hình ảnh hợp lệ',
      reason: 'Yêu cầu nằm trong phạm vi xử lý hình ảnh (ánh sáng, góc máy, dáng đứng, độ rủ vải, nền ảnh), không vi phạm cấu trúc trang phục.',
      guidance: 'Sẵn sàng khởi tạo phiên bản tinh chỉnh mới.',
      changes,
      preserved: [
        'Bảo toàn nguyên vẹn dáng áo và cấu trúc cổ phục cổ truyền.',
        'Khóa cố định cổ lập lĩnh, ống tay và bảng màu bản phối gốc.'
      ],
      allowedClauses,
      blockedClauses: []
    };
  }

  // Case 2: Structural Contradiction takes priority in severity
  if (hasStructuralBlock) {
    const structuralItem = blockedClauses.find(b => b.category === 'STRUCTURAL_CONTRADICTION');
    return {
      category: 'STRUCTURAL_CONTRADICTION',
      allowed: false,
      title: 'Phát hiện xung đột cấu trúc trang phục cổ truyền',
      reason: structuralItem?.reason || 'Yêu cầu loại bỏ hoặc thay đổi cấu trúc cốt lõi (cổ áo/ống tay/tà áo/khuy cài) vi phạm quy chế nhận diện trang phục cổ truyền đã khóa.',
      guidance: 'Cấu trúc nền của trang phục không thể bị loại bỏ trong bước tinh chỉnh ảnh. Nếu muốn thay đổi kiểu dáng trang phục, bạn có thể chọn lại mẫu áo ở phần Gợi ý hoặc xem xét các bản phối khác.',
      allowedClauses,
      blockedClauses,
      suggestedColorId: primarySuggestedColor
    };
  }

  // Case 3: Blueprint Mutation Required
  const bpItem = blockedClauses.find(b => b.category === 'BLUEPRINT_MUTATION_REQUIRED');
  return {
    category: 'BLUEPRINT_MUTATION_REQUIRED',
    allowed: false,
    title: 'Yêu cầu thuộc phạm vi cấu hình Bản phối (Blueprint)',
    reason: bpItem?.reason || 'Thao tác thay đổi mẫu áo, bảng màu, chất liệu, quần/váy hoặc phụ kiện cần được thực hiện trong Bản phối (Blueprint), không thể tinh chỉnh qua xử lý ảnh.',
    guidance: bpItem?.suggestedAction === 'CHANGE_COLOR'
      ? 'Bạn có thể đổi màu chủ đạo trực tiếp trong Bản phối (Section 2) mà không cần vẽ lại ảnh ngay.'
      : 'Vui lòng cập nhật thông số trong phần Bản phối (Section 2) hoặc chọn lại mẫu áo ở phần Gợi ý (Section 1).',
    allowedClauses,
    blockedClauses,
    suggestedColorId: primarySuggestedColor
  };
}
