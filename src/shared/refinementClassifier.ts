/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * User-Guided Refinement Request Classifier
 *
 * Classifies user-guided refinement text into one of three categories:
 * 1. IMAGE_ONLY_ALLOWED: Image-level rendering adjustments (lighting, pose, angle, drape, background)
 * 2. STRUCTURAL_CONTRADICTION: Requests that attempt to mutate or remove protected traditional garment structural traits (collars, sleeves, lapels, buttons/closures)
 * 3. BLUEPRINT_MUTATION_REQUIRED: Requests that attempt to change Blueprint configuration attributes (garment type, palette, fabric, lower garment, footwear, wearable accessories)
 */

export type RefinementClassificationCategory =
  | 'IMAGE_ONLY_ALLOWED'
  | 'STRUCTURAL_CONTRADICTION'
  | 'BLUEPRINT_MUTATION_REQUIRED';

export interface RefinementClassificationResult {
  category: RefinementClassificationCategory;
  allowed: boolean; // true ONLY for IMAGE_ONLY_ALLOWED
  title: string;
  reason: string;
  guidance: string;
  changes?: string[];
  preserved?: string[];
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

  const lower = text.toLowerCase();

  // -------------------------------------------------------------------------
  // 1. CHECK STRUCTURAL CONTRADICTION
  // Requests attempting to remove/alter protected traditional garment structures
  // -------------------------------------------------------------------------

  // A. Collar removal / modification (Standing collar / Cổ lập lĩnh / Cổ áo)
  const collarRemovalPattern = /(xóa|bỏ|bỏ\s*bớt|không\s*cần|cắt|cắt\s*bớt|không\s*có|triệt\s*tiêu|loại\s*bỏ|thay\s*đổi|sửa)\s*(phần\s*)?(cổ|cổ\s*áo|cổ\s*lập\s*lĩnh|cổ\s*đứng)/i;
  const directCollarRemoval = /(cổ\s*áo\s*(đi|ra|mất)|bỏ\s*cổ|xóa\s*cổ)/i;

  // B. Sleeve geometry mutation based on current garment
  let sleeveContradiction = false;
  let sleeveReason = '';
  if (garmentId === 'ngu_than_chen') {
    // Áo ngũ thân tay chẽn must preserve tay chẽn
    if (/(tay\s*thụng|tay\s*rộng|xóa\s*tay\s*chẽn|bỏ\s*tay\s*chẽn|mở\s*rộng\s*ống\s*tay|chuyển\s*thành\s*tay\s*thụng|thành\s*tay\s*thụng)/i.test(lower)) {
      sleeveContradiction = true;
      sleeveReason = 'Yêu cầu mở rộng hoặc chuyển sang tay thụng xung đột với kết cấu Áo ngũ thân tay chẽn.';
    }
  } else if (garmentId === 'ao_tac') {
    // Áo tấc (tay thụng) must preserve tay thụng
    if (/(tay\s*chẽn|bóp\s*ống\s*tay|thu\s*hẹp\s*ống\s*tay|xóa\s*tay\s*thụng|bỏ\s*tay\s*thụng|thành\s*tay\s*chẽn)/i.test(lower)) {
      sleeveContradiction = true;
      sleeveReason = 'Yêu cầu bóp hẹp hoặc chuyển sang tay chẽn xung đột với kết cấu Áo tấc (ngũ thân tay thụng).';
    }
  } else if (garmentId === 'ao_tu_than') {
    // Áo tứ thân must preserve 4 tà, yếm
    if (/(xóa\s*yếm|bỏ\s*yếm|bỏ\s*4\s*tà|xóa\s*tà|may\s*liền\s*tà)/i.test(lower)) {
      sleeveContradiction = true;
      sleeveReason = 'Yêu cầu loại bỏ yếm hoặc biến đổi 4 tà xung đột với kết cấu Áo tứ thân.';
    }
  }

  // C. Tail / Lapel / Panel / Closure / Structural removals
  const tailPanelRemoval = /(xóa|bỏ|cắt|triệt\s*tiêu)\s*(phần\s*)?(tà|vạt|tà\s*áo|vạt\s*áo|5\s*tà|4\s*tà|khuy|khuy\s*cài|cúc|cúc\s*cài)/i;
  const generalStructuralRemoval = /(xóa|bỏ|thay\s*đổi)\s*(cấu\s*trúc|kết\s*cấu|dáng\s*áo\s*nền)/i;

  if (
    collarRemovalPattern.test(lower) ||
    directCollarRemoval.test(lower) ||
    sleeveContradiction ||
    tailPanelRemoval.test(lower) ||
    generalStructuralRemoval.test(lower)
  ) {
    return {
      category: 'STRUCTURAL_CONTRADICTION',
      allowed: false,
      title: 'Phát hiện xung đột cấu trúc trang phục cổ truyền',
      reason: sleeveReason || 'Yêu cầu loại bỏ hoặc thay đổi cấu trúc cốt lõi (cổ áo/ống tay/tà áo/khuy cài) vi phạm quy chế nhận diện trang phục cổ truyền đã khóa.',
      guidance: 'Cấu trúc nền của trang phục không thể bị loại bỏ trong bước tinh chỉnh ảnh. Nếu muốn thay đổi kiểu dáng trang phục, vui lòng quay lại Bàn thiết kế (Step 3) hoặc Màn định danh (Step 2) để chọn lại mẫu áo nền.'
    };
  }

  // -------------------------------------------------------------------------
  // 2. CHECK BLUEPRINT MUTATION REQUIRED
  // Requests attempting to alter Blueprint properties (garment type, palette, fabric, footwear, lower garment, wearable accessories)
  // -------------------------------------------------------------------------

  // Garment type switching
  const garmentSwitchPattern = /(đổi|chuyển|thay)\s*(sang|thành)?\s*(áo\s*tấc|áo\s*tứ\s*thân|áo\s*ngũ\s*thân|áo\s*dài)/i;

  // Palette / Color mutation
  const colorMutationPattern = /(đổi|thay|chuyển)\s*(màu|bảng\s*màu|sắc\s*độ)\s*(áo|trang\s*phục|sang|thành)?/i;
  const directColorPattern = /(thành\s*màu|sang\s*màu)\s*(đỏ|xanh|vàng|trắng|đen|tím|hồng|cam|nâu|xám)/i;

  // Fabric mutation
  const fabricMutationPattern = /(đổi|thay|chuyển)\s*(chất\s*liệu|vải|sang\s*gấm|sang\s*lụa|sang\s*tơ)/i;

  // Lower garment / Footwear / Wearable accessories mutation
  const accessoryMutationPattern = /(đổi|thay|đeo\s*thêm)\s*(quần|váy|giày|dép|khăn\s*đóng|kính|mũ|túi|trang\s*sức)/i;

  if (
    garmentSwitchPattern.test(lower) ||
    colorMutationPattern.test(lower) ||
    directColorPattern.test(lower) ||
    fabricMutationPattern.test(lower) ||
    accessoryMutationPattern.test(lower)
  ) {
    return {
      category: 'BLUEPRINT_MUTATION_REQUIRED',
      allowed: false,
      title: 'Yêu cầu thuộc phạm vi cấu hình Bản phối (Blueprint)',
      reason: 'Thao tác thay đổi mẫu áo, bảng màu, chất liệu, quần/váy hoặc phụ kiện cần được thực hiện trong Bản phối (Blueprint), không thể tinh chỉnh qua xử lý ảnh.',
      guidance: 'Vui lòng quay lại Bàn thiết kế (Step 3) để cập nhật thông số bản phối mới.'
    };
  }

  // -------------------------------------------------------------------------
  // 3. IMAGE_ONLY_ALLOWED
  // Visual image adjustments (lighting, pose, angle, drape, background, approved contextual props)
  // -------------------------------------------------------------------------
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
    reason: 'Yêu cầu nằm trong phạm vi xử lý hình ảnh (ánh sáng, góc máy, dáng đứng, độ rủ vải), không vi phạm cấu trúc trang phục.',
    guidance: 'Sẵn sàng khởi tạo phiên bản tinh chỉnh mới.',
    changes,
    preserved: [
      'Bảo toàn nguyên vẹn dáng áo và cấu trúc cổ phục cổ truyền.',
      'Khóa cố định cổ lập lĩnh, ống tay và bảng màu bản phối gốc.'
    ]
  };
}
