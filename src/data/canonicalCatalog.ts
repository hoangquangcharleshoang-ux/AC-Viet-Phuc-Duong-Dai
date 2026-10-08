/**
 * AC — Canonical Option Catalog
 * Grounded in: MASTER FINAL & BUILD BRIEF FINAL
 * Canonical IDs for Deterministic Lookup in Decoupled Blueprint Pipeline
 */

export interface PaletteOption {
  id: string;
  hex: string;
  name: string;
}

export interface CatalogItem {
  id: string;
  label: string;
  desc?: string;
}

// 1. PALETTES: Bảng màu chuẩn mực cổ truyền và đương đại
export const PALETTES: PaletteOption[] = [
  { id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm' },
  { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc' },
  { id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ' },
  { id: 'xanh_ngoc_bich', hex: '#4A7C72', name: 'Xanh ngọc bích' },
  { id: 'hong_canh_sen', hex: '#C25975', name: 'Hồng sen phấn' },
  { id: 'tim_hue_hoa_ca', hex: '#5E3A58', name: 'Tím hoa cà' },
  { id: 'trang_nga_bach_ngoc', hex: '#F5F2EB', name: 'Trắng ngà' },
  { id: 'den_tuyen', hex: '#1F1F1F', name: 'Đen tuyền' },
  { id: 'be_moc_linen', hex: '#D8CBB5', name: 'Be mộc đũi' },
  { id: 'xanh_thien_thanh', hex: '#6BA4B8', name: 'Xanh thiên thanh' }
];

// 2. FABRICS: Chất liệu truyền thống và tiếp biến tự nhiên
export const FABRICS: CatalogItem[] = [
  { id: 'to_tam_ha_dong', label: 'Tơ tằm Hà Đông dệt thủ công' },
  { id: 'gam_hoa_chim', label: 'Gấm dệt hoa văn chìm mực thước' },
  { id: 'sa_to_mong', label: 'Sa tơ mỏng nhẹ thoáng khí' },
  { id: 'dui_moc_tu_nhien', label: 'Đũi tơ mộc dệt thô tự nhiên' },
  { id: 'linen_cao_cap', label: 'Linen dệt thoáng cao cấp' },
  { id: 'taffeta_mat', label: 'Taffeta mờ giữ phom thanh lịch' },
  { id: 'lua_to_tam_tron', label: 'Lụa tơ tằm trơn mềm rủ' }
];

// 3. LOWER_GARMENTS: Hạ phục truyền thống và âu phục giao thoa
export const LOWER_GARMENTS: CatalogItem[] = [
  { id: 'silk_pants_wide', label: 'Quần lụa trắng ống rộng truyền thống' },
  { id: 'silk_pants_black', label: 'Quần lụa đen ống rộng mực thước' },
  { id: 'tailored_trousers_straight', label: 'Quần tây ống đứng âu phục tối giản' },
  { id: 'vay_dup_den', label: 'Váy đụp lụa đen truyền thống Bắc Bộ' },
  { id: 'pleated_skirt_long', label: 'Chân váy xếp ly dáng dài thanh lịch' },
  { id: 'culottes_linen', label: 'Quần lửng culottes ống suông vải đũi' }
];

// 4. FOOTWEAR: Giày dép từ cổ truyền tới thời trang đương đại
export const FOOTWEAR: CatalogItem[] = [
  { id: 'leather_loafer', label: 'Giày da loafer tối giản thanh lịch' },
  { id: 'guoc_moc_truyen_thong', label: 'Guốc mộc quai nhung truyền thống' },
  { id: 'chunky_sneaker', label: 'Giày sneaker đế thô phá cách' },
  { id: 'classic_oxford', label: 'Giày da Oxford cổ điển trang trọng' },
  { id: 'mule_minimalist', label: 'Dép mule / sục gót thấp thanh thoát' },
  { id: 'strappy_sandals', label: 'Sandals quai mảnh tối giản' }
];

// 5. ACCESSORIES: Phụ kiện điểm nhấn văn hóa
export const ACCESSORIES: CatalogItem[] = [
  { id: 'khan_dong_truyen_thong', label: 'Khăn đóng / khăn xếp truyền thống' },
  { id: 'khan_mo_qua', label: 'Khăn mỏ quạ chít nếp nhọn Bắc Bộ' },
  { id: 'non_thung_quai_thao', label: 'Nón thúng quai thao truyền thống' },
  { id: 'tui_coton_theu_tay', label: 'Túi tote linen thêu họa tiết chỉ tơ' },
  { id: 'quat_giay_tram_huong', label: 'Quạt giấy nan tre hương trầm' },
  { id: 'chuoi_ngoc_trai_co', label: 'Chuỗi ngọc trai cổ điển thanh lịch' },
  { id: 'kinh_ram_gong_tron', label: 'Kính râm gọng tròn retro đương đại' },
  { id: 'vong_bac_cham_hoa', label: 'Kiềng bạc / vòng bạc chạm hoa văn cổ' }
];

// Lookup Helpers
export function getPaletteById(id: string): PaletteOption {
  return PALETTES.find(p => p.id === id) || PALETTES[0];
}

export function getFabricLabel(id: string): string {
  return FABRICS.find(f => f.id === id)?.label || id;
}

export function getLowerGarmentLabel(id: string): string {
  return LOWER_GARMENTS.find(l => l.id === id)?.label || id;
}

export function getFootwearLabel(id: string): string {
  return FOOTWEAR.find(f => f.id === id)?.label || id;
}

export function getAccessoryLabel(id: string): string {
  return ACCESSORIES.find(a => a.id === id)?.label || id;
}
