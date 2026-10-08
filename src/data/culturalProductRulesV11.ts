/**
 * AC — Cultural Product Rules Supplement v1.1 (APPROVED FOR G2, NOT YET WIRED TO RUNTIME)
 *
 * Purpose:
 * - Normalize wearer/gender, ensemble, accessory and contemporary-remix research
 *   into machine-readable product policy before G2 integration.
 * - Keep historical evidence separate from product recommendation behavior.
 *
 * IMPORTANT:
 * - This file is approved for G2 integration but is NOT imported by Call A/B/Exploration/QA yet.
 * - Runtime integration requires explicit G2 work and regression coverage.
 * - Do not treat NOT_ESTABLISHED as "historically impossible".
 */

import type {
  EvidenceStatus,
  GarmentId,
  GenderPresentation,
  OccasionId,
} from '../types/index';

export const CULTURAL_PRODUCT_RULES_VERSION = '1.1-approved' as const;

export type HistoricalUseStatus =
  | 'HISTORICAL_CANONICAL'
  | 'DOCUMENTED_CONTEXTUAL'
  | 'HERITAGE_REVIVAL'
  | 'CONTEMPORARY_REINTERPRETATION'
  | 'STAGE_PERFORMANCE'
  | 'COMMERCIAL_PRACTICE'
  | 'NOT_ESTABLISHED';

export type WearerHistoricalStatus =
  | 'DOCUMENTED'
  | 'CONTEXTUAL'
  | 'NOT_ESTABLISHED';

export type RemixCompatibility =
  | 'SAFE_CONTEMPORARY'
  | 'CONTEXTUAL_REMIX'
  | 'HIGH_REMIX'
  | 'CROSS_CULTURAL_RISK'
  | 'CORE_CONFLICT'
  | 'NOT_ESTABLISHED';

export type AutoSelectionPolicy =
  | 'PREFER'
  | 'ALLOW'
  | 'EXPLICIT_ONLY'
  | 'DO_NOT_AUTO_SELECT';

export type RecommendationPolicy =
  | 'AUTO_ELIGIBLE'
  | 'CONTEXTUAL'
  | 'EXPLICIT_REINTERPRETATION_ONLY'
  | 'DO_NOT_AUTO_RECOMMEND';

export type StylingCategory =
  | 'HEADWEAR'
  | 'HAIR_ORNAMENT'
  | 'NECK_CHEST'
  | 'WAIST'
  | 'HANDHELD'
  | 'JEWELRY'
  | 'FOOTWEAR'
  | 'LOWER_GARMENT'
  | 'BAG'
  | 'EYEWEAR'
  | 'OUTERWEAR'
  | 'HAIRSTYLE';

export type SocialContext =
  | 'GENERAL'
  | 'FOLK'
  | 'URBAN'
  | 'RITUAL'
  | 'COURT_ELITE'
  | 'EDITORIAL'
  | 'PERFORMANCE';

export type TraditionalityBand =
  | 'TRADITIONAL_LEANING'
  | 'BALANCED'
  | 'CONTEMPORARY_LEANING';

export interface SupplementSource {
  id: string;
  title: string;
  institution: string;
  url?: string;
  note: string;
}

export interface WearerCompatibilityRule {
  garmentId: GarmentId;
  wearer: Exclude<GenderPresentation, 'neutral'>;
  historicalStatus: WearerHistoricalStatus;
  recommendationPolicy: RecommendationPolicy;
  evidenceStatus: EvidenceStatus;
  sourceIds: string[];
  scopeNote: string;
  productRule: string;
}

export interface StylingProfile {
  garmentIds: GarmentId[];
  wearer: 'nam' | 'nu' | 'both';
  occasionIds?: OccasionId[];
  socialContexts?: SocialContext[];
  historicalStatus: HistoricalUseStatus;
  remixCompatibility: RemixCompatibility;
  autoSelection: AutoSelectionPolicy;
  evidenceStatus: EvidenceStatus;
  sourceIds: string[];
  minTraditionalRatio?: number;
  maxTraditionalRatio?: number;
  note: string;
}

export interface StylingElementRule {
  id: string;
  labelVi: string;
  category: StylingCategory;
  profiles: StylingProfile[];
}

export const SUPPLEMENT_SOURCES_V11: Record<string, SupplementSource> = {
  'SRC-V11-01': {
    id: 'SRC-V11-01',
    title: 'Lễ trao tặng áo dài ngũ thân truyền thống',
    institution: 'Sở Văn hóa và Thể thao TP.HCM',
    url: 'https://svhtt.hochiminhcity.gov.vn/tin-chi-tiet/-/chi-tiet/le-trao-tang-ao-dai-ngu-than-truyen-thong-nhan-ngay-di-san-van-hoa-23-thang-11-23561-1002.html',
    note: 'Supports documented modern heritage reconstruction/practice for male and female ngũ thân ensembles; use cautiously for historical universals.',
  },
  'SRC-V11-02': {
    id: 'SRC-V11-02',
    title: 'Phụ nữ Hà Nội trong trang phục truyền thống đầu thế kỷ 20',
    institution: 'Bảo tàng Hà Nội',
    url: 'https://baotanghanoi.com.vn/phu-nu-ha-noi-trong-trang-phuc-truyen-thong-dau-the-ki-20-ve-dep-cua-su-giao-thoi/',
    note: 'Supports context-specific female ensemble evidence in early-20th-century Hanoi, including headwear/footwear/lower-garment combinations.',
  },
  'SRC-V11-03': {
    id: 'SRC-V11-03',
    title: 'Áo tấc - cổ phục quý đang hồi sinh',
    institution: 'Cổng thông tin du lịch Huế / TS. Phan Thanh Hải',
    url: 'https://huetourism.gov.vn/ao-tac-co-phuc-quy-dang-hoi-sinh/?pid=MjExMjB8Y3NkbGRs0',
    note: 'Supports áo tấc ceremonial function, use by men and women, and context-specific accompanying headwear/ensemble descriptions.',
  },
  'SRC-V11-04': {
    id: 'SRC-V11-04',
    title: 'Vẻ đẹp vĩnh cửu - trang sức ngọc cung đình triều Nguyễn',
    institution: 'Bảo tàng Lịch sử Quốc gia',
    url: 'https://baotanglichsu.vn/vi/Articles/3096/17693/ve-djep-vinh-cuu-trang-suc-ngoc-cung-djinh-trieu-nguyen.html',
    note: 'Supports court/elite/rank-specific context for jade and precious ornaments; does not justify generic garment-wide default use.',
  },
} as const;

/**
 * Wearer eligibility is a product policy derived from evidence.
 * "NOT_ESTABLISHED" means the current AC corpus does not establish a historical
 * canonical use; it is NOT a claim that such use never existed.
 */
export const WEARER_COMPATIBILITY_V11: WearerCompatibilityRule[] = [
  {
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    historicalStatus: 'DOCUMENTED',
    recommendationPolicy: 'AUTO_ELIGIBLE',
    evidenceStatus: 'VERIFIED',
    sourceIds: ['SRC-03', 'SRC-05', 'SRC-V11-01'],
    scopeNote: 'Nguyễn-era ngũ thân/tay chẽn corpus plus heritage reconstruction evidence.',
    productRule: 'May be auto-recommended for male wearer context when occasion/function fit.',
  },
  {
    garmentId: 'ngu_than_chen',
    wearer: 'nu',
    historicalStatus: 'DOCUMENTED',
    recommendationPolicy: 'AUTO_ELIGIBLE',
    evidenceStatus: 'VERIFIED',
    sourceIds: ['SRC-03', 'SRC-V11-01', 'SRC-V11-02'],
    scopeNote: 'Documented female use; exact ensemble varies by period/region.',
    productRule: 'May be auto-recommended for female wearer context; do not force a single universal lower-garment/headwear profile.',
  },
  {
    garmentId: 'ao_tac',
    wearer: 'nam',
    historicalStatus: 'DOCUMENTED',
    recommendationPolicy: 'AUTO_ELIGIBLE',
    evidenceStatus: 'VERIFIED',
    sourceIds: ['SRC-04', 'SRC-05', 'SRC-V11-03'],
    scopeNote: 'Ceremonial/liturgical use; styling must remain occasion-sensitive.',
    productRule: 'May be auto-recommended for male wearer when ceremonial/context fit is strong.',
  },
  {
    garmentId: 'ao_tac',
    wearer: 'nu',
    historicalStatus: 'DOCUMENTED',
    recommendationPolicy: 'AUTO_ELIGIBLE',
    evidenceStatus: 'VERIFIED',
    sourceIds: ['SRC-04', 'SRC-V11-03'],
    scopeNote: 'Documented female ceremonial use; avoid inventing universal jewelry/hair defaults.',
    productRule: 'May be auto-recommended for female wearer when ceremonial/context fit is strong.',
  },
  {
    garmentId: 'ao_tu_than',
    wearer: 'nu',
    historicalStatus: 'DOCUMENTED',
    recommendationPolicy: 'AUTO_ELIGIBLE',
    evidenceStatus: 'VERIFIED',
    sourceIds: ['SRC-06', 'SRC-07'],
    scopeNote: 'Scoped to the Northern/Kinh áo tứ thân profile used by AC.',
    productRule: 'Female wearer is historically documented and may be auto-recommended when occasion fit is appropriate.',
  },
  {
    garmentId: 'ao_tu_than',
    wearer: 'nam',
    historicalStatus: 'NOT_ESTABLISHED',
    recommendationPolicy: 'EXPLICIT_REINTERPRETATION_ONLY',
    evidenceStatus: 'UNKNOWN',
    sourceIds: ['SRC-06', 'SRC-07'],
    scopeNote: 'Current AC corpus strongly describes Northern/Kinh áo tứ thân as women\'s dress; male historical canonical use is not established in this scope.',
    productRule: 'Do not auto-recommend as historical/traditional male dress. Allow only when the user explicitly requests a contemporary reinterpretation and label it as such.',
  },
];

export const STYLING_ELEMENTS_V11: StylingElementRule[] = [
  {
    id: 'khan_dong_male',
    labelVi: 'Khăn đóng / khăn vấn nam',
    category: 'HEADWEAR',
    profiles: [
      {
        garmentIds: ['ao_tac'],
        wearer: 'nam',
        socialContexts: ['RITUAL', 'GENERAL'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'PREFER',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-04', 'SRC-V11-03'],
        minTraditionalRatio: 60,
        note: 'Appropriate as a ceremonial/traditional ensemble cue; not mandatory in every modern styling context.',
      },
      {
        garmentIds: ['ngu_than_chen'],
        wearer: 'nam',
        socialContexts: ['GENERAL', 'RITUAL'],
        historicalStatus: 'HERITAGE_REVIVAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'ALLOW',
        evidenceStatus: 'PROBABLE',
        sourceIds: ['SRC-V11-01'],
        minTraditionalRatio: 60,
        note: 'Supported as heritage-revival practice; avoid claiming it as a universal historical default.',
      },
    ],
  },
  {
    id: 'khan_van_female',
    labelVi: 'Khăn vấn nữ',
    category: 'HEADWEAR',
    profiles: [
      {
        garmentIds: ['ao_tac'],
        wearer: 'nu',
        socialContexts: ['RITUAL', 'GENERAL'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'ALLOW',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-V11-03'],
        minTraditionalRatio: 60,
        note: 'Documented with female áo tấc in ceremonial context; not a universal hairstyle rule.',
      },
      {
        garmentIds: ['ngu_than_chen'],
        wearer: 'nu',
        socialContexts: ['URBAN', 'GENERAL'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'ALLOW',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-V11-02'],
        minTraditionalRatio: 60,
        note: 'Context-specific evidence from early-20th-century Hanoi; do not universalize to all regions/periods.',
      },
    ],
  },
  {
    id: 'khan_mo_qua',
    labelVi: 'Khăn mỏ quạ',
    category: 'HEADWEAR',
    profiles: [
      {
        garmentIds: ['ao_tu_than'],
        wearer: 'nu',
        socialContexts: ['FOLK', 'GENERAL'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'ALLOW',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-06'],
        minTraditionalRatio: 60,
        note: 'Supporting ensemble cue for Northern female tứ thân; not an essential identity trait.',
      },
    ],
  },
  {
    id: 'non_thung_quai_thao',
    labelVi: 'Nón thúng quai thao',
    category: 'HEADWEAR',
    profiles: [
      {
        garmentIds: ['ao_tu_than'],
        wearer: 'nu',
        socialContexts: ['FOLK', 'RITUAL', 'PERFORMANCE'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'ALLOW',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-06', 'SRC-07'],
        minTraditionalRatio: 60,
        note: 'Use as context-sensitive supporting element; avoid making it mandatory.',
      },
    ],
  },
  {
    id: 'waist_sash_ruot_tuong',
    labelVi: 'Dải thắt lưng / ruột tượng',
    category: 'WAIST',
    profiles: [
      {
        garmentIds: ['ao_tu_than'],
        wearer: 'nu',
        socialContexts: ['FOLK', 'GENERAL'],
        historicalStatus: 'HISTORICAL_CANONICAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'PREFER',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-06'],
        minTraditionalRatio: 60,
        note: 'Strong ensemble cue around the waist; exact styling varies by context.',
      },
    ],
  },
  {
    id: 'guoc_moc',
    labelVi: 'Guốc mộc',
    category: 'FOOTWEAR',
    profiles: [
      {
        garmentIds: ['ao_tu_than'],
        wearer: 'nu',
        socialContexts: ['FOLK', 'GENERAL'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'PREFER',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-06'],
        minTraditionalRatio: 60,
        note: 'Strong traditional ensemble option for Northern tứ thân.',
      },
      {
        garmentIds: ['ngu_than_chen'],
        wearer: 'nu',
        socialContexts: ['URBAN', 'GENERAL'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'ALLOW',
        evidenceStatus: 'VERIFIED',
        sourceIds: ['SRC-V11-02'],
        minTraditionalRatio: 60,
        note: 'Context-specific early-20th-century Hanoi evidence; not a universal ngũ thân default.',
      },
    ],
  },
  {
    id: 'formal_shoes',
    labelVi: 'Giày / hài trang trọng',
    category: 'FOOTWEAR',
    profiles: [
      {
        garmentIds: ['ao_tac'],
        wearer: 'both',
        socialContexts: ['RITUAL', 'GENERAL'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'PREFER',
        evidenceStatus: 'PROBABLE',
        sourceIds: ['SRC-04', 'SRC-V11-03'],
        minTraditionalRatio: 50,
        note: 'Prefer formal footwear for ceremonial áo tấc; avoid turning one exact footwear type into a universal historical rule.',
      },
    ],
  },
  {
    id: 'hairpin_simple',
    labelVi: 'Trâm cài tóc',
    category: 'HAIR_ORNAMENT',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'],
        wearer: 'nu',
        historicalStatus: 'NOT_ESTABLISHED',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'EXPLICIT_ONLY',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 59,
        note: 'General historical existence of hair ornaments does not establish a garment-specific default. Never infer "female → hairpin".',
      },
    ],
  },
  {
    id: 'jade_pendant',
    labelVi: 'Ngọc bội / kim bội',
    category: 'NECK_CHEST',
    profiles: [
      {
        garmentIds: ['ao_tac'],
        wearer: 'both',
        socialContexts: ['COURT_ELITE'],
        historicalStatus: 'DOCUMENTED_CONTEXTUAL',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'EXPLICIT_ONLY',
        evidenceStatus: 'PROBABLE',
        sourceIds: ['SRC-V11-04'],
        note: 'Court/elite/rank context is required. Never infer "male áo tấc → jade pendant".',
      },
    ],
  },
  {
    id: 'pearl_necklace',
    labelVi: 'Vòng cổ ngọc trai',
    category: 'NECK_CHEST',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'],
        wearer: 'both',
        socialContexts: ['EDITORIAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'EXPLICIT_ONLY',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 39,
        note: 'May be used as an explicit contemporary/editorial choice; never present as a historical default.',
      },
    ],
  },
  {
    id: 'handheld_fan',
    labelVi: 'Quạt cầm tay',
    category: 'HANDHELD',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'],
        wearer: 'both',
        socialContexts: ['EDITORIAL', 'PERFORMANCE'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'EXPLICIT_ONLY',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 59,
        note: 'Current corpus does not support a universal garment-specific historical default.',
      },
    ],
  },
  {
    id: 'minimal_jewelry',
    labelVi: 'Trang sức tối giản hiện đại',
    category: 'JEWELRY',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'],
        wearer: 'both',
        socialContexts: ['GENERAL', 'EDITORIAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'SAFE_CONTEMPORARY',
        autoSelection: 'ALLOW',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 59,
        note: 'Contemporary styling only. Keep visually subordinate to garment identity.',
      },
    ],
  },
  {
    id: 'modern_bag',
    labelVi: 'Túi hiện đại tối giản',
    category: 'BAG',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'],
        wearer: 'both',
        socialContexts: ['GENERAL', 'URBAN', 'EDITORIAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'SAFE_CONTEMPORARY',
        autoSelection: 'ALLOW',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 69,
        note: 'Modern peripheral styling; do not describe as historical practice.',
      },
    ],
  },
  {
    id: 'modern_eyewear',
    labelVi: 'Kính mắt hiện đại',
    category: 'EYEWEAR',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'],
        wearer: 'both',
        socialContexts: ['GENERAL', 'URBAN', 'EDITORIAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'SAFE_CONTEMPORARY',
        autoSelection: 'ALLOW',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 69,
        note: 'Modern peripheral styling; avoid ornate/fantasy frames that dominate the garment.',
      },
    ],
  },
  {
    id: 'minimal_sneakers',
    labelVi: 'Sneaker tối giản',
    category: 'FOOTWEAR',
    profiles: [
      {
        garmentIds: ['ngu_than_chen'],
        wearer: 'both',
        socialContexts: ['URBAN', 'EDITORIAL', 'GENERAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'SAFE_CONTEMPORARY',
        autoSelection: 'ALLOW',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 69,
        note: 'Low-risk contemporary pairing for casual/remix contexts.',
      },
      {
        garmentIds: ['ao_tac'],
        wearer: 'both',
        socialContexts: ['EDITORIAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'HIGH_REMIX',
        autoSelection: 'EXPLICIT_ONLY',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 39,
        note: 'Do not auto-select for ceremonial/traditional áo tấc.',
      },
      {
        garmentIds: ['ao_tu_than'],
        wearer: 'nu',
        socialContexts: ['URBAN', 'EDITORIAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'CONTEXTUAL_REMIX',
        autoSelection: 'ALLOW',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 39,
        note: 'Modern reinterpretation only; keep traditional lower/waist identity cues intact when possible.',
      },
    ],
  },
  {
    id: 'minimal_boots',
    labelVi: 'Boot tối giản',
    category: 'FOOTWEAR',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tac', 'ao_tu_than'],
        wearer: 'both',
        socialContexts: ['EDITORIAL'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'HIGH_REMIX',
        autoSelection: 'EXPLICIT_ONLY',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 39,
        note: 'High-remix editorial option; never historical default.',
      },
    ],
  },
  {
    id: 'oversized_blazer',
    labelVi: 'Blazer khoác ngoài',
    category: 'OUTERWEAR',
    profiles: [
      {
        garmentIds: ['ngu_than_chen', 'ao_tu_than'],
        wearer: 'both',
        socialContexts: ['EDITORIAL', 'URBAN'],
        historicalStatus: 'CONTEMPORARY_REINTERPRETATION',
        remixCompatibility: 'HIGH_REMIX',
        autoSelection: 'EXPLICIT_ONLY',
        evidenceStatus: 'UNKNOWN',
        sourceIds: [],
        maxTraditionalRatio: 39,
        note: 'Intentional contemporary layering. Preserve visible garment identity and label as remix.',
      },
    ],
  },
];

export const PRODUCT_POLICY_V11 = {
  traditionalityBands: {
    TRADITIONAL_LEANING: { min: 70, max: 100 },
    BALANCED: { min: 40, max: 69 },
    CONTEMPORARY_LEANING: { min: 0, max: 39 },
  },
  neutralWearer: {
    isHistoricalClaim: false,
    rule:
      'neutral means user has no presentation preference; it must not be converted into a historical gender claim.',
    aoTuThanTraditionalRule:
      'For Northern/Kinh ao_tu_than in a traditional-leaning context, use the documented female historical profile unless the user explicitly requests a contemporary male reinterpretation.',
  },
  recommendation: {
    aoTacCasualRule:
      'Do not prefer ao_tac for ordinary casual/street use when a functionally better garment exists; allow as explicit/editorial remix.',
    aoTuThanMaleRule:
      'Do not auto-recommend historical Northern/Kinh ao_tu_than for explicit male wearer context. Contemporary reinterpretation requires explicit user intent and clear labeling.',
  },
  accessorySelection: {
    rule:
      'Select accessories from garment × wearer × occasion × social-context profiles; never from one undifferentiated random accessory pool.',
    noEvidenceFallback:
      'If no compatible approved profile exists, prefer no accessory over invention.',
  },
  imagePromptGuardrails: [
    'Do not invent crowns, imperial ornaments, jade pendants, pearl necklaces, ornate hairpins, tassel fans, or ceremonial props unless explicitly present in the approved Blueprint.',
    'Avoid generic prompt language such as ancient Asian costume, oriental royal accessories, or fantasy imperial jewelry.',
    'Contemporary accessories must not be described as historical evidence.',
  ],
  hairstyle: {
    safeContemporaryDefaults: [
      'natural short hair',
      'natural long hair',
      'simple low bun',
      'simple tied-back hair',
    ],
    rule:
      'Do not automatically convert female wearer into elaborate historical hair with hairpins, or male wearer into a historical topknot/headwrap. Historical head styling requires an approved profile.',
  },
  hardStops: [
    'CORE_CONFLICT cannot be auto-selected as remix.',
    'NOT_ESTABLISHED cannot be presented as historical fact.',
    'COURT_ELITE-context styling cannot be generalized to ordinary wearer profiles.',
    'User-requested contemporary reinterpretation must remain clearly labeled as contemporary.',
  ],
} as const;

export function getTraditionalityBand(traditionalRatio: number): TraditionalityBand {
  if (traditionalRatio >= 70) return 'TRADITIONAL_LEANING';
  if (traditionalRatio >= 40) return 'BALANCED';
  return 'CONTEMPORARY_LEANING';
}

export function getWearerCompatibilityRule(
  garmentId: GarmentId,
  wearer: Exclude<GenderPresentation, 'neutral'>,
): WearerCompatibilityRule | undefined {
  return WEARER_COMPATIBILITY_V11.find(
    (rule) => rule.garmentId === garmentId && rule.wearer === wearer,
  );
}

export function getStylingProfiles(
  elementId: string,
  garmentId: GarmentId,
  wearer: Exclude<GenderPresentation, 'neutral'>,
): StylingProfile[] {
  const element = STYLING_ELEMENTS_V11.find((item) => item.id === elementId);
  if (!element) return [];

  return element.profiles.filter(
    (profile) =>
      profile.garmentIds.includes(garmentId) &&
      (profile.wearer === 'both' || profile.wearer === wearer),
  );
}
