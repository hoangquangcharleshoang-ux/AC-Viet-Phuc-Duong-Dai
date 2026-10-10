import { GarmentId, GenderPresentation } from '../types/index';

/**
 * Centralized Wearer & Garment Eligibility Policy (Cultural Product Rules v1.1)
 * 
 * - ngu_than_chen: male, female, neutral -> allowed
 * - ao_tac: male, female, neutral -> allowed
 * - ao_tu_than: female, neutral -> allowed; male -> blocked in grounded MVP corpus.
 */
export function isWearerGarmentEligible(
  garmentId: GarmentId,
  wearer: GenderPresentation
): boolean {
  if (garmentId === 'ao_tu_than' && wearer === 'nam') {
    return false;
  }
  return true;
}

export function getWearerIncompatibilityMessage(
  garmentId: GarmentId,
  wearer: GenderPresentation
): string {
  if (garmentId === 'ao_tu_than' && wearer === 'nam') {
    return 'Trong phạm vi tư liệu lịch sử AC đang sử dụng, Áo tứ thân Bắc Bộ được ghi nhận là trang phục truyền thống của phụ nữ đồng bằng Bắc Bộ. Vì vậy, grounded MVP của AC chỉ hỗ trợ cấu hình người mặc nữ cho Áo tứ thân.';
  }
  return 'Dáng áo và cấu hình người mặc tương thích.';
}
