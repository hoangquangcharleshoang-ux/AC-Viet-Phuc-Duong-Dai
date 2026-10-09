/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C: Server-Side Deterministic Cultural Visual QA Aggregator
 *
 * Grounded in: MASTER FINAL & Cultural Knowledge Pack v1.0
 * Purely deterministic: Aggregates raw Vision observations into validated CulturalVisualQAOutput
 * Hard-failure eligibility strictly enforced: Only essential traits with evidence_status === 'VERIFIED'
 * can trigger CHANGES_CORE_IDENTIFICATION.
 */

import {
  GarmentId,
  CulturalIdentityStatus,
  RawTraitEvidence,
  RawOutfitFidelityEvidence,
  EvaluatedTraitItem,
  CulturalVisualQAOutput,
  TraitVerdict,
  EvidenceStatus,
  GroundedCorrectionPlan,
  GenerationSnapshot,
  ContextProp
} from '../../src/types/index';
import {
  getFabricLabel,
  getLowerGarmentLabel,
  getFootwearLabel,
  getAccessoryLabel
} from '../../src/data/canonicalCatalog';

export const QA_SCHEMA_VERSION = '1.0.0';
export const CULTURAL_KNOWLEDGE_VERSION = '1.0.0';
export const VISUAL_AUDIT_POLICY_VERSION = '1.0.0';

export function isApprovedContextProp(
  item: string,
  contextProps: ContextProp[] = []
): boolean {
  if (!item || !Array.isArray(contextProps) || contextProps.length === 0) return false;
  const normItem = item.toLowerCase().trim();
  return contextProps.some(prop => {
    if (!prop || !prop.description) return false;
    const normDesc = prop.description.toLowerCase().trim();
    if (normItem.includes(normDesc) || normDesc.includes(normItem)) return true;
    const itemWords = normItem.split(/[\s,.-]+/).filter(w => w.length > 2);
    const descWords = normDesc.split(/[\s,.-]+/).filter(w => w.length > 2);
    const commonWords = itemWords.filter(w => descWords.includes(w));
    return commonWords.length >= 1;
  });
}

export interface GarmentTraitSpec {
  traitId: string;
  traitNameVi: string;
  category: 'essential' | 'strongly_characteristic' | 'supporting' | 'variable';
  claim_type: string;
  evidence_status: EvidenceStatus;
  source_refs: string[];
  descriptionVi: string;
  canonicalGuidance: string;
}

export const CANONICAL_GARMENT_TRAITS: Record<GarmentId, GarmentTraitSpec[]> = {
  ngu_than_chen: [
    {
      traitId: 'collar_standing_mandarin',
      traitNameVi: 'Cổ đứng lập lĩnh dựng ôm khít chân cổ',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05'],
      descriptionVi: 'Cổ đứng lập lĩnh dựng thẳng vuông vức ôm sát chân cổ (2–5 cm), nẹp phẳng phiu không bẻ gấp.',
      canonicalGuidance: 'Cổ áo phải là cổ đứng lập lĩnh ôm khít chân cổ, không bẻ ve, không khoét sâu hay may tròn kiểu âu phục.'
    },
    {
      traitId: 'closure_right_flap_quang',
      traitNameVi: 'Cài vạt chéo sang nách phải (khuy chữ quảng)',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05'],
      descriptionVi: 'Vạt áo ngoài phủ chéo sang phía sườn/nách phải của người mặc, gài khuy định hình.',
      canonicalGuidance: 'Vạt áo ngoài phải cài chéo sang phía nách phải của người mặc, cài bằng hàng khuy chữ quảng.'
    },
    {
      traitId: 'sleeves_fitted_trach_tu',
      traitNameVi: 'Ống tay bóp hẹp thu dần về cổ tay (trách tụ)',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05'],
      descriptionVi: 'Ống tay áo may thu hẹp dần từ khuỷu tay đến ôm gọn quanh cổ tay, hoặc phom ống suông chẽn thon gọn ôm dọc cánh tay, không xòe thụng rộng kiểu Áo tấc.',
      canonicalGuidance: 'Ống tay áo ngũ thân chẽn (trách tụ) phải thuôn gọn hoặc suông chẽn dọc cánh tay về cổ tay, không được may xòe thụng rộng.'
    },
    {
      traitId: 'five_panels_inner_flap',
      traitNameVi: 'Cấu trúc 5 thân ghép khổ vải có vạt con bên trong',
      category: 'strongly_characteristic',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05'],
      descriptionVi: 'Gồm 2 thân trước, 2 thân sau và 1 vạt con (thân thứ 5) nằm lót kín đáo bên trong vạt trước.',
      canonicalGuidance: 'Cấu trúc 5 thân ghép dọc theo khổ vải cổ truyền có vạt con che chắn kín đáo.'
    },
    {
      traitId: 'five_buttons_right',
      traitNameVi: 'Hàng 5 khuy cài cứng bố trí góc nách phải',
      category: 'strongly_characteristic',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05'],
      descriptionVi: 'Hệ 5 khuy cài tượng trưng cho ngũ thường/ngũ luân, bố trí dọc từ cổ xuống nách và sườn phải.',
      canonicalGuidance: 'Hàng 5 khuy cài bố trí dọc góc nách phải từ chân cổ xuống sườn.'
    },
    {
      traitId: 'silhouette_straight_no_darts',
      traitNameVi: 'Phom dáng suông buông tự nhiên, không chiết eo',
      category: 'strongly_characteristic',
      claim_type: 'silhouette_geometry',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05'],
      descriptionVi: 'Thân áo buông suông thẳng đứng, tà xòe nhẹ tự nhiên không nhấn eo hay bóp hông kiểu âu phục.',
      canonicalGuidance: 'Phom áo suông thẳng tự nhiên theo trục dọc, tuyệt đối không chích ben hay chiết eo bó sát phong cách áo dài tân thời.'
    },
    {
      traitId: 'back_center_seam',
      traitNameVi: 'Đường sống áo trung phùng giữa lưng',
      category: 'supporting',
      claim_type: 'seam_construction',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03', 'SRC-05'],
      descriptionVi: 'Đường may sống lưng ghép đôi khổ vải chạy dọc chính giữa sống lưng.',
      canonicalGuidance: 'Đường sống áo trung phùng ghép đôi khổ vải chạy dọc giữa lưng.'
    },
    {
      traitId: 'material_natural_silk',
      traitNameVi: 'Chất liệu vải dệt tự nhiên (tơ tằm, gấm, sa, đũi)',
      category: 'supporting',
      claim_type: 'material_culture',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-05', 'SRC-06'],
      descriptionVi: 'Vải dệt sợi tự nhiên có độ rủ mềm mại, không có độ bóng phản quang nhân tạo.',
      canonicalGuidance: 'Chất liệu dệt sợi tự nhiên mộc, tơ tằm, gấm sa mềm mại, không dùng lụa phi bóng nhân tạo bắt sáng gắt.'
    },
    {
      traitId: 'body_color',
      traitNameVi: 'Màu sắc thân áo hài hòa',
      category: 'variable',
      claim_type: 'aesthetic_variable',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03'],
      descriptionVi: 'Màu sắc thân áo trang nhã theo bảng màu hòa sắc truyền thống hoặc đương đại.',
      canonicalGuidance: 'Hòa sắc thân áo theo đúng tông màu đã chỉ định.'
    },
    {
      traitId: 'woven_pattern',
      traitNameVi: 'Hoa văn dệt chìm/nổi',
      category: 'variable',
      claim_type: 'aesthetic_variable',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-03'],
      descriptionVi: 'Họa tiết hoa văn dệt chìm hoặc hoa văn truyền thống tinh tế.',
      canonicalGuidance: 'Hoa văn dệt chìm hoặc in chìm nhã nhặn.'
    },
    {
      traitId: 'button_material',
      traitNameVi: 'Chất liệu khuy cài (đồng, bạc, ngọc, gỗ)',
      category: 'variable',
      claim_type: 'aesthetic_variable',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-05'],
      descriptionVi: 'Khuy bấm hoặc khuy cúc chế tác từ kim loại, ngọc hoặc gỗ.',
      canonicalGuidance: 'Khuy cúc chế tác gọn gàng, tinh tế.'
    }
  ],
  ao_tac: [
    {
      traitId: 'collar_standing_mandarin',
      traitNameVi: 'Cổ đứng lập lĩnh dựng ôm khít cổ',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04', 'SRC-05'],
      descriptionVi: 'Cổ đứng lập lĩnh dựng vuông vức ôm sát chân cổ mang tính lễ nghi trang nghiêm.',
      canonicalGuidance: 'Cổ áo phải là cổ đứng lập lĩnh dựng vuông ôm sát chân cổ.'
    },
    {
      traitId: 'closure_right_flap_quang',
      traitNameVi: 'Cài khuy sang nách phải',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04', 'SRC-05'],
      descriptionVi: 'Vạt áo phủ chéo cài khuy sang phía nách phải của người mặc.',
      canonicalGuidance: 'Vạt áo phủ chéo cài khuy sang phía nách phải của người mặc.'
    },
    {
      traitId: 'sleeves_wide_rectangular_box',
      traitNameVi: 'Ống tay may thụng rộng hình khối chữ nhật (khoán tụ)',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04', 'SRC-05'],
      descriptionVi: 'Ống tay thụng rộng thẳng hình chữ nhật, tuyệt đối không bóp hẹp cổ tay, phục vụ tư thế chắp tay giao thụng.',
      canonicalGuidance: 'Ống tay Áo tấc (khoán tụ) BẮT BUỘC may thụng rộng thẳng hình chữ nhật, cổ tay mở rộng tự nhiên không được bóp hẹp hay may chẽn sát cổ tay.'
    },
    {
      traitId: 'five_panels_inner_flap',
      traitNameVi: 'Cấu trúc 5 thân ghép vải có vạt con bên trong',
      category: 'strongly_characteristic',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04', 'SRC-05'],
      descriptionVi: 'Cấu trúc 5 thân ghép dọc có vạt con che chắn kín đáo bên trong.',
      canonicalGuidance: 'Cấu trúc 5 thân ghép dọc có vạt con lót bên trong.'
    },
    {
      traitId: 'five_buttons_right',
      traitNameVi: 'Hàng 5 khuy cài hình chữ quảng',
      category: 'strongly_characteristic',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04', 'SRC-05'],
      descriptionVi: 'Hệ 5 khuy cài bố trí góc nách và sườn phải.',
      canonicalGuidance: 'Hàng 5 khuy cài bố trí góc nách phải trang nghiêm.'
    },
    {
      traitId: 'ceremonial_long_silhouette',
      traitNameVi: 'Phom dáng buông rộng thụng dài qua gối',
      category: 'strongly_characteristic',
      claim_type: 'silhouette_geometry',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04', 'SRC-05'],
      descriptionVi: 'Tà áo dài rộng quá gối trang nghiêm, phom dáng phóng khoáng mang tính lễ phục.',
      canonicalGuidance: 'Phom áo thụng dài qua đầu gối, buông rủ mực thước mang phong thái lễ phục triều Nguyễn.'
    },
    {
      traitId: 'sleeves_length_past_fingertips',
      traitNameVi: 'Chiều dài tay áo buông qua đầu ngón tay khoảng 1 tấc',
      category: 'strongly_characteristic',
      claim_type: 'morphology_measure',
      evidence_status: 'PROBABLE',
      source_refs: ['SRC-04'],
      descriptionVi: 'Tay áo buông thõng phủ kín quá đầu ngón tay khoảng 1 tấc khi buông tay tự nhiên.',
      canonicalGuidance: 'Tay áo buông dài phủ qua đầu ngón tay theo phong cách áo thụng lễ nghi.'
    },
    {
      traitId: 'wide_flowing_hem',
      traitNameVi: 'Tà áo xòe rộng buông dài qua gối',
      category: 'supporting',
      claim_type: 'silhouette_geometry',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04'],
      descriptionVi: 'Độ xòe tà lớn tạo dáng vẻ mực thước khi đứng hoặc di chuyển.',
      canonicalGuidance: 'Độ xòe tà rộng rãi mực thước.'
    },
    {
      traitId: 'folded_hem_border',
      traitNameVi: 'Nẹp tà may gập viền lớn trang trọng',
      category: 'supporting',
      claim_type: 'seam_construction',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04'],
      descriptionVi: 'Đường nẹp viền tà lớn dày dặn tôn nét trang trọng.',
      canonicalGuidance: 'Đường nẹp may viền gập lớn đĩnh đạc.'
    },
    {
      traitId: 'ceremonial_color',
      traitNameVi: 'Màu sắc lễ nghi (đỏ, xanh, vàng, tím, đen...)',
      category: 'variable',
      claim_type: 'aesthetic_variable',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04'],
      descriptionVi: 'Màu sắc rực rỡ hoặc trang nhã tùy thuộc tính chất ngày lễ hội hay nghi thức.',
      canonicalGuidance: 'Màu sắc theo đúng bảng màu bản phối yêu cầu.'
    },
    {
      traitId: 'woven_silk_brocade',
      traitNameVi: 'Chất liệu gấm, lụa, sa trơn hoặc dệt hoa văn',
      category: 'variable',
      claim_type: 'material_culture',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-04', 'SRC-05'],
      descriptionVi: 'Chất liệu vải cao cấp có độ đứng phom và ánh nhung mịn.',
      canonicalGuidance: 'Chất liệu vải có độ đứng phom tự nhiên.'
    }
  ],
  ao_tu_than: [
    {
      traitId: 'four_panels_structure',
      traitNameVi: 'Cấu trúc 4 thân vải (2 sau liền sống lưng, 2 trước tách rời)',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Hai thân sau may liền kín sống lưng, hai thân trước buông độc lập không khép kín bằng khuy cài ngực.',
      canonicalGuidance: 'Áo tứ thân gồm 2 thân sau may liền sống lưng và 2 thân trước tách rời độc lập.'
    },
    {
      traitId: 'front_open_no_chest_buttons',
      traitNameVi: 'Thân trước mở vạt, không có hàng khuy cài ngực',
      category: 'essential',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Mặt trước để mở tự nhiên hoặc buộc vạt trước bụng, không có hàng khuy cài chữ quảng như áo ngũ thân.',
      canonicalGuidance: 'Thân trước Áo tứ thân BẮT BUỘC để mở vạt tự nhiên hoặc buộc vạt trước bụng, tuyệt đối không may kín cúc ngực hay có hàng khuy nách.'
    },
    {
      traitId: 'front_flaps_hanging_or_tied',
      traitNameVi: 'Vạt trước buông thả song song hoặc buộc vạt trước bụng',
      category: 'strongly_characteristic',
      claim_type: 'structural_anatomy',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Hai vạt trước có thể buông thả mềm mại hoặc thắt nút duyên dáng ngang eo/bụng.',
      canonicalGuidance: 'Hai vạt trước buông thả song song hoặc thắt nút trước bụng.'
    },
    {
      traitId: 'layered_inner_yem',
      traitNameVi: 'Mối quan hệ phân tầng với lớp nội phục (áo yếm) che ngực',
      category: 'essential',
      claim_type: 'layering_system',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Lớp yếm lót bên trong lộ phần cổ yếm hoặc bờ ngực một cách đoan trang phía sau vạt áo mở.',
      canonicalGuidance: 'Phía sau thân áo mở là lớp áo yếm che ngực truyền thống độc lập.'
    },
    {
      traitId: 'inner_camisole_layer',
      traitNameVi: 'Lớp áo cánh mỏng trung gian',
      category: 'supporting',
      claim_type: 'layering_system',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Lớp áo cánh lụa mỏng mặc giữa yếm và áo tứ thân tạo hiệu ứng phân tầng thị giác.',
      canonicalGuidance: 'Lớp áo cánh mỏng nhẹ phân tầng duyên dáng.'
    },
    {
      traitId: 'non_quai_thao_hat',
      traitNameVi: 'Nón thúng quai thao to bản',
      category: 'supporting',
      claim_type: 'accessory_tradition',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Nón thúng quai thao truyền thống phụ nữ Bắc Bộ.',
      canonicalGuidance: 'Nón thúng quai thao to bản vùng đồng bằng Bắc Bộ.'
    },
    {
      traitId: 'khan_mo_qua_headscarf',
      traitNameVi: 'Khăn mỏ quạ chít nếp nhọn trán',
      category: 'supporting',
      claim_type: 'accessory_tradition',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Khăn đen vấn hình mỏ quạ tạo góc nhọn thanh tú trên trán.',
      canonicalGuidance: 'Khăn mỏ quạ chít nếp nhọn tinh tế trên trán.'
    },
    {
      traitId: 'sash_belt',
      traitNameVi: 'Dải thắt lưng, ruột tượng giữ cạp',
      category: 'strongly_characteristic',
      claim_type: 'aesthetic_variable',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Dải lụa thắt lưng màu hoa đào, xanh lục hoặc ruột tượng buộc ngoài eo.',
      canonicalGuidance: 'Dải lụa thắt lưng mềm mại thắt nhẹ quanh eo.'
    },
    {
      traitId: 'lower_garment_skirt_or_pants',
      traitNameVi: 'Hạ phục (váy đụp đen nguyên bản hoặc quần lụa đen)',
      category: 'variable',
      claim_type: 'material_culture',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Váy đụp lụa đen chấm gót hoặc quần lụa đen ống rộng.',
      canonicalGuidance: 'Hạ phục váy đụp đen hoặc quần lụa ống rộng.'
    },
    {
      traitId: 'layered_layers_count',
      traitNameVi: 'Số lượng lớp mặc (mộc mạc đến mớ ba mớ bảy)',
      category: 'variable',
      claim_type: 'aesthetic_variable',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06', 'SRC-07'],
      descriptionVi: 'Cách lồng ghép từ 2 lớp giản dị đến mớ ba mớ bảy rực rỡ trong hội hè.',
      canonicalGuidance: 'Phân tầng trang phục hài hòa.'
    },
    {
      traitId: 'color_and_yem_palette',
      traitNameVi: 'Màu sắc thân áo và lớp yếm',
      category: 'variable',
      claim_type: 'aesthetic_variable',
      evidence_status: 'VERIFIED',
      source_refs: ['SRC-06'],
      descriptionVi: 'Hòa sắc giữa thân áo màu trầm (nâu, đen, tím than) và yếm sáng màu (đỏ, hồng, điều).',
      canonicalGuidance: 'Hòa sắc thân áo và yếm phối hợp ăn ý.'
    }
  ]
};

export const STATUS_LABELS_VI: Record<CulturalIdentityStatus, string> = {
  PRESERVES_IDENTITY: 'Nhận diện tổng thể ổn',
  CONTEXT_SENSITIVE: 'Hài hòa trong cách tân đương đại',
  WEAKENS_RECOGNIZABILITY: 'Nhận diện văn hóa bị mờ nhạt',
  CHANGES_CORE_IDENTIFICATION: 'Có dấu hiệu lệch cấu trúc nhận diện',
  INSUFFICIENT_EVIDENCE: 'Góc ảnh chưa đủ cứ liệu đối chiếu'
};

/**
 * Deterministic Decision Tree Aggregation Engine (Step 3 Requirements)
 * Enforces evidence status hard-failure eligibility.
 */
export function aggregateCulturalVisualQA(
  garmentId: GarmentId,
  rawTraits: RawTraitEvidence[],
  outfitFidelityRaw: RawOutfitFidelityEvidence,
  generationId: string,
  boundFingerprint: string,
  contextProps?: ContextProp[]
): CulturalVisualQAOutput {
  const specs = CANONICAL_GARMENT_TRAITS[garmentId] || CANONICAL_GARMENT_TRAITS.ngu_than_chen;
  const specMap = new Map<string, GarmentTraitSpec>();
  for (const s of specs) {
    specMap.set(s.traitId, s);
  }

  // Combine raw evidence with canonical taxonomy and evidence metadata
  const evaluatedTraits: EvaluatedTraitItem[] = [];
  const rawMap = new Map<string, RawTraitEvidence>();
  for (const r of rawTraits) {
    rawMap.set(r.traitId, r);
  }

  for (const spec of specs) {
    const raw = rawMap.get(spec.traitId);
    if (raw) {
      evaluatedTraits.push({
        traitId: spec.traitId,
        category: spec.category,
        traitNameVi: spec.traitNameVi,
        verdict: raw.verdict,
        visualEvidence: raw.visualEvidence || 'Đã đối soát qua thị giác AI.',
        observedDeviation: raw.observedDeviation,
        evidence_status: spec.evidence_status,
        source_refs: spec.source_refs
      });
    } else {
      // Missing trait -> treat as NOT_ASSESSABLE
      evaluatedTraits.push({
        traitId: spec.traitId,
        category: spec.category,
        traitNameVi: spec.traitNameVi,
        verdict: 'NOT_ASSESSABLE',
        visualEvidence: 'Không tìm thấy dữ liệu đối soát trực quan cho đặc trưng này.',
        evidence_status: spec.evidence_status,
        source_refs: spec.source_refs
      });
    }
  }

  // Tally counts
  const essentialTraits = evaluatedTraits.filter(t => t.category === 'essential');
  const stronglyTraits = evaluatedTraits.filter(t => t.category === 'strongly_characteristic');
  const supportingTraits = evaluatedTraits.filter(t => t.category === 'supporting');
  const variableTraits = evaluatedTraits.filter(t => t.category === 'variable');

  // Hard-failure eligibility gate: Only essential traits with evidence_status === 'VERIFIED'
  const verifiedEssentialFails = essentialTraits.filter(
    t => t.verdict === 'FAIL' && t.evidence_status === 'VERIFIED'
  ).length;

  const unverifiedEssentialFails = essentialTraits.filter(
    t => t.verdict === 'FAIL' && t.evidence_status !== 'VERIFIED'
  ).length;

  const essentialPartialCount = essentialTraits.filter(t => t.verdict === 'PARTIAL').length;
  const essentialNotAssessableCount = essentialTraits.filter(t => t.verdict === 'NOT_ASSESSABLE').length;
  const assessableEssentialsCount = essentialTraits.filter(t => t.verdict !== 'NOT_ASSESSABLE').length;

  const verifiedStronglyFails = stronglyTraits.filter(
    t => t.verdict === 'FAIL' && t.evidence_status === 'VERIFIED'
  ).length;

  const unverifiedStronglyFails = stronglyTraits.filter(
    t => t.verdict === 'FAIL' && t.evidence_status !== 'VERIFIED'
  ).length;

  // Requirement 6: Strongly-characteristic PARTIAL policy discrimination
  const stronglyWeakeningPartials = stronglyTraits.filter(t => {
    if (t.verdict !== 'PARTIAL') return false;
    if (
      t.evidence_status === 'VERIFIED' &&
      (t.traitId === 'silhouette_straight_no_darts' ||
        t.traitId === 'five_buttons_right' ||
        t.traitId === 'ceremonial_long_silhouette' ||
        t.traitId === 'five_panels_inner_flap')
    ) {
      return true;
    }
    return false;
  }).length;

  const stronglyAcceptablePartials = stronglyTraits.filter(t => {
    if (t.verdict !== 'PARTIAL') return false;
    return !stronglyWeakeningPartials;
  }).length;

  const assessableCount = evaluatedTraits.filter(t => t.verdict !== 'NOT_ASSESSABLE').length;

  let overallStatus: CulturalIdentityStatus = 'PRESERVES_IDENTITY';

  // Per-garment coverage floor (minimum assessable essentials required for positive conclusions)
  const minimumAssessableEssentials = Math.max(1, Math.ceil(essentialTraits.length * 0.5));

  // ----------------------------------------------------
  // STEP 1: Core structure altered
  // Only essential traits with evidence_status === 'VERIFIED' can trigger CHANGES_CORE_IDENTIFICATION
  // ----------------------------------------------------
  if (verifiedEssentialFails >= 1) {
    overallStatus = 'CHANGES_CORE_IDENTIFICATION';
  }
  // ----------------------------------------------------
  // STEP 2: Weakened recognizability
  // ----------------------------------------------------
  else if (
    essentialPartialCount >= 1 ||
    verifiedStronglyFails >= 1 ||
    stronglyWeakeningPartials >= 1 ||
    unverifiedEssentialFails >= 1
  ) {
    overallStatus = 'WEAKENS_RECOGNIZABILITY';
  }
  // ----------------------------------------------------
  // STEP 3: Insufficient observational evidence / Coverage Floor
  // Coverage floor gates positive conclusions. If assessable essentials are below minimum or total assessable count is 0 -> INSUFFICIENT_EVIDENCE
  // ----------------------------------------------------
  else if (
    assessableEssentialsCount < minimumAssessableEssentials ||
    assessableCount === 0
  ) {
    overallStatus = 'INSUFFICIENT_EVIDENCE';
  }
  // ----------------------------------------------------
  // STEP 4: Explicit canonical CONTEXT_SENSITIVE policy only
  // ----------------------------------------------------
  // (Reserved for explicit contextual policy matching)
  // ----------------------------------------------------
  // STEP 5: Standard identity preservation
  // Requires meeting assessable coverage floor + all assessable essentials passing (not requiring 100% all essential traits explicitly assessed as PASS).
  // ----------------------------------------------------
  else {
    overallStatus = 'PRESERVES_IDENTITY';
  }

  // ----------------------------------------------------
  // OUTFIT FIDELITY AGGREGATION (100% Decoupled from Cultural Identity)
  // ----------------------------------------------------
  let overallFidelity: 'PASS' | 'PARTIAL' | 'FAIL' = 'PASS';

  const paletteFails =
    (outfitFidelityRaw.palette?.primaryMatch === 'FAIL' ? 1 : 0) +
    (outfitFidelityRaw.palette?.supportingMatch === 'FAIL' ? 1 : 0) +
    (outfitFidelityRaw.palette?.accentMatch === 'FAIL' ? 1 : 0);

  const expectedAccessoryFails = (outfitFidelityRaw.expectedAccessories || []).filter(
    a => a.verdict === 'FAIL'
  ).length;

  const rawUnexpected = outfitFidelityRaw.unexpectedAccessories || [];
  const unexpectedAccessories = contextProps && contextProps.length > 0
    ? rawUnexpected.filter(item => !isApprovedContextProp(item, contextProps))
    : rawUnexpected;

  const unexpectedCount = unexpectedAccessories.length;

  if (
    paletteFails >= 2 ||
    outfitFidelityRaw.fabricMatch === 'FAIL' ||
    outfitFidelityRaw.lowerGarmentMatch === 'FAIL' ||
    expectedAccessoryFails >= 2 ||
    unexpectedCount >= 2
  ) {
    overallFidelity = 'FAIL';
  } else if (
    paletteFails === 1 ||
    outfitFidelityRaw.fabricMatch === 'PARTIAL' ||
    outfitFidelityRaw.lowerGarmentMatch === 'PARTIAL' ||
    outfitFidelityRaw.footwearMatch === 'PARTIAL' ||
    outfitFidelityRaw.footwearMatch === 'FAIL' ||
    expectedAccessoryFails === 1 ||
    unexpectedCount === 1 ||
    (outfitFidelityRaw.expectedAccessories || []).some(a => a.verdict === 'PARTIAL')
  ) {
    overallFidelity = 'PARTIAL';
  } else {
    overallFidelity = 'PASS';
  }

  return {
    generationId,
    boundFingerprint,
    auditedAt: Date.now(),
    versions: {
      qaSchemaVersion: QA_SCHEMA_VERSION,
      culturalKnowledgeVersion: CULTURAL_KNOWLEDGE_VERSION,
      visualAuditPolicyVersion: VISUAL_AUDIT_POLICY_VERSION
    },
    culturalIdentity: {
      overallStatus,
      statusLabelVi: STATUS_LABELS_VI[overallStatus],
      assessableTraitsCount: assessableCount,
      totalTraitsCount: evaluatedTraits.length,
      traits: evaluatedTraits
    },
    outfitFidelity: {
      overallFidelity,
      details: {
        palette: outfitFidelityRaw.palette || {
          primaryMatch: 'PASS',
          supportingMatch: 'PASS',
          accentMatch: 'PASS'
        },
        fabricMatch: outfitFidelityRaw.fabricMatch || 'PASS',
        lowerGarmentMatch: outfitFidelityRaw.lowerGarmentMatch || 'PASS',
        footwearMatch: outfitFidelityRaw.footwearMatch || 'PASS',
        expectedAccessories: outfitFidelityRaw.expectedAccessories || [],
        unexpectedAccessories: unexpectedAccessories
      }
    }
  };
}

/**
 * Construct Grounded Dual-Source Revision Plan
 * Grounded in FAIL / PARTIAL traits and snapshot expectations.
 * Actionable evidence only: NOT_ASSESSABLE traits are NEVER targeted for correction.
 */
export function buildGroundedCorrectionPlan(
  garmentId: GarmentId,
  qaOutput: CulturalVisualQAOutput,
  snapshot: GenerationSnapshot
): GroundedCorrectionPlan {
  const specs = CANONICAL_GARMENT_TRAITS[garmentId] || CANONICAL_GARMENT_TRAITS.ngu_than_chen;
  const specMap = new Map<string, GarmentTraitSpec>();
  for (const s of specs) {
    specMap.set(s.traitId, s);
  }

  // 1. Cultural Correction Deltas (FAIL or PARTIAL traits for essential & strongly_characteristic categories)
  // Rules:
  // - Approximate/probable numerical folk thresholds (such as exact sleeve length in cm or ~1 tấc beyond fingertip / morphology_measure)
  //   must NEVER be rigid correction targets unless the trait is completely missing or inverted (e.g. tay thụng turned into tay chẽn).
  // - Well-defined strongly-characteristic traits with PROBABLE or APPROXIMATE evidence that have a clearly observable structural distortion
  //   (e.g. five buttons missing or wrong side, collar shape completely missing) CAN be corrected when visibility allows.
  // - Speculative, ambiguous (DISPUTED), or UNKNOWN evidence must NEVER generate corrections.
  // - NOT_ASSESSABLE traits NEVER generate corrections.
  const culturalDeltas: GroundedCorrectionPlan['culturalDeltas'] = [];
  for (const trait of qaOutput.culturalIdentity.traits) {
    if (trait.verdict === 'FAIL' || trait.verdict === 'PARTIAL') {
      const spec = specMap.get(trait.traitId);
      if (!spec) continue;

      // Exclude non-VERIFIED traits unless an explicit trait-level actionability policy overrides it
      // (PROBABLE / APPROXIMATE / DISPUTED / UNKNOWN without explicit override must NOT generate rigid cultural corrections)
      if (spec.evidence_status !== 'VERIFIED' && !(spec as any).actionableIfApproximate) {
        continue;
      }

      // Include essential & strongly_characteristic traits with clear structural distortion
      if (spec.category === 'essential' || spec.category === 'strongly_characteristic') {
        culturalDeltas.push({
          traitId: trait.traitId,
          traitNameVi: trait.traitNameVi,
          category: trait.category,
          verdict: trait.verdict,
          observedDeviation: trait.observedDeviation || trait.visualEvidence,
          canonicalGuidance: spec.canonicalGuidance || `Khôi phục chuẩn mực đặc trưng ${trait.traitNameVi}.`
        });
      }
    }
  }

  // 2. Outfit Fidelity Deltas (Color mismatch, unexpected accessories, fabric/lower deviations)
  const fidelityDeltas: GroundedCorrectionPlan['fidelityDeltas'] = [];
  const fidelity = qaOutput.outfitFidelity.details;

  const snap = snapshot as any;
  const palette = snap?.palette || snap?.remixProposal?.palette || [];
  const fabricId = snap?.fabricId || snap?.remixProposal?.fabricId || '';
  const lowerGarmentId = snap?.lowerGarmentId || snap?.remixProposal?.lowerGarmentId || '';
  const footwearId = snap?.footwearId || snap?.remixProposal?.footwearId || '';
  const activeAccessoryIds = snap?.activeAccessoryIds || snap?.remixProposal?.accessoryIds || [];

  if (fidelity.palette.primaryMatch === 'FAIL' || fidelity.palette.primaryMatch === 'PARTIAL') {
    const primary = palette.find((p: any) => p.role === 'PRIMARY') || palette[0];
    fidelityDeltas.push({
      element: 'palette',
      description: 'Màu chủ đạo thân áo chưa đúng với màu đã chọn.',
      expectedValue: `${primary?.name || 'Màu chỉ định'} (${primary?.hex || ''})`
    });
  }

  if (fidelity.palette.supportingMatch === 'FAIL' || fidelity.palette.supportingMatch === 'PARTIAL') {
    const supp = palette.find((p: any) => p.role === 'SUPPORTING') || palette[1];
    if (supp) {
      fidelityDeltas.push({
        element: 'palette',
        description: 'Màu phối bổ trợ chưa chuẩn xác.',
        expectedValue: `${supp.name || 'Màu phối'} (${supp.hex || ''})`
      });
    }
  }

  if (fidelity.palette.accentMatch === 'FAIL' || fidelity.palette.accentMatch === 'PARTIAL') {
    const accent = palette.find((p: any) => p.role === 'ACCENT') || palette[2];
    if (accent) {
      fidelityDeltas.push({
        element: 'palette',
        description: 'Màu điểm nhấn chưa thể hiện đúng.',
        expectedValue: `${accent.name || 'Màu điểm nhấn'} (${accent.hex || ''})`
      });
    }
  }

  if (fidelity.fabricMatch === 'FAIL' || fidelity.fabricMatch === 'PARTIAL') {
    fidelityDeltas.push({
      element: 'fabric',
      description: 'Chất liệu vải thân áo cần thể hiện đúng kết cấu dệt tự nhiên.',
      expectedValue: getFabricLabel(fabricId)
    });
  }

  if (fidelity.lowerGarmentMatch === 'FAIL' || fidelity.lowerGarmentMatch === 'PARTIAL') {
    fidelityDeltas.push({
      element: 'lowerGarment',
      description: 'Hạ phục chưa khớp với bản phối chỉ định.',
      expectedValue: getLowerGarmentLabel(lowerGarmentId)
    });
  }

  if (fidelity.footwearMatch === 'FAIL' || fidelity.footwearMatch === 'PARTIAL') {
    fidelityDeltas.push({
      element: 'footwear',
      description: 'Kiểu dáng giày dép chưa khớp với bản phối.',
      expectedValue: getFootwearLabel(footwearId)
    });
  }

  const contextProps = snap?.contextProps || snap?.remixProposal?.contextProps || [];
  const rawUnexpected = fidelity.unexpectedAccessories || [];
  const trulyUnexpected = rawUnexpected.filter((item: string) => !isApprovedContextProp(item, contextProps));

  if (trulyUnexpected.length > 0) {
    fidelityDeltas.push({
      element: 'accessories',
      description: `Loại bỏ các phụ kiện ngoài dự kiến: ${trulyUnexpected.map(getAccessoryLabel).join(', ')}.`,
      expectedValue: activeAccessoryIds.length > 0
        ? `Chỉ mang các phụ kiện: ${activeAccessoryIds.map(getAccessoryLabel).join(', ')}`
        : 'Không mang thêm phụ kiện thừa'
    });
  }

  // 3. Locked Preservation Constraints (For all PASS traits and committed context)
  const preservationConstraints: string[] = [];
  for (const trait of qaOutput.culturalIdentity.traits) {
    if (trait.verdict === 'PASS') {
      preservationConstraints.push(`Giữ nguyên đặc trưng đã đạt chuẩn: ${trait.traitNameVi}`);
    }
  }
  if (activeAccessoryIds.length > 0) {
    preservationConstraints.push(`Bảo toàn các phụ kiện đã phê duyệt trong bản phối: ${activeAccessoryIds.map(getAccessoryLabel).join(', ')}`);
  }
  if (contextProps.length > 0) {
    const propDescs = contextProps.map((p: any) => p.description).join(', ');
    preservationConstraints.push(`Bảo toàn các đạo cụ bối cảnh đã phê duyệt trong bản phối: ${propDescs}`);
  }
  preservationConstraints.push('Bảo toàn bố cục chụp ảnh lookbook toàn thân, ánh sáng tự nhiên và phom dáng người mẫu.');

  const totalFixes = culturalDeltas.length + fidelityDeltas.length;
  const revisionTargetSummary = totalFixes > 0
    ? `Kế hoạch tinh chỉnh gồm ${culturalDeltas.length} điểm văn hóa và ${fidelityDeltas.length} điểm tương khớp bản phối.`
    : 'Bản phối phù hợp với tiêu chí đối chiếu hiện tại, các đặc trưng cốt lõi được bảo toàn.';

  const elementLabelMap: Record<string, string> = {
    palette: 'Bảng màu',
    fabric: 'Chất liệu vải',
    lowerGarment: 'Hạ phục',
    footwear: 'Giày dép',
    accessories: 'Phụ kiện'
  };

  const actionableDeltas = [
    ...culturalDeltas.map(c => ({
      type: 'cultural' as const,
      id: c.traitId,
      name: c.traitNameVi,
      guidance: c.canonicalGuidance,
      deviation: c.observedDeviation
    })),
    ...fidelityDeltas.map(f => ({
      type: 'fidelity' as const,
      id: f.element,
      name: elementLabelMap[f.element] || f.element,
      guidance: f.expectedValue,
      deviation: f.description
    }))
  ];

  return {
    culturalDeltas,
    fidelityDeltas,
    actionableDeltas,
    preservationConstraints,
    revisionTargetSummary
  };
}
