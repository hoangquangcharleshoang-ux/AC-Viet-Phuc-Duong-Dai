/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Canonical Data Types & Contract Schemas
 * Grounded in: MASTER FINAL & BUILD BRIEF FINAL
 */

export type OccasionId = 'tet_temple' | 'cultural_wedding' | 'street_cafe';
export type RemixIntent = 'traditional' | 'balanced' | 'expressive';
export type GarmentId = 'ngu_than_chen' | 'ao_tac' | 'ao_tu_than';

export type LinterStatus =
  | 'PRESERVES_IDENTITY'
  | 'CONTEXT_SENSITIVE'
  | 'WEAKENS_RECOGNIZABILITY'
  | 'CHANGES_CORE_IDENTIFICATION'
  | 'INSUFFICIENT_EVIDENCE'
  | 'EVALUATION_UNAVAILABLE'; // Technical failure state

export type ReasonCode =
  | 'NONE'
  | 'CONTEXT_FUNCTION_CONFLICT'
  | 'PERFORMANCE_COSTUME_ASSOCIATION'
  | 'CORE_TRAIT_CHANGED'
  | 'RECOGNIZABILITY_WEAKENED'
  | 'EVIDENCE_INSUFFICIENT';

export type ReasoningBasis =
  | 'SOURCE_SUPPORTED_FACT'
  | 'REASONABLE_INTERPRETATION'
  | 'CONTEMPORARY_STYLING_RECOMMENDATION'
  | 'UNKNOWN_OR_DISPUTED';

export type TraitLevel =
  | 'essential'
  | 'strongly_characteristic'
  | 'supporting'
  | 'variable'
  | null;

export type EvidenceStatus =
  | 'VERIFIED'
  | 'PROBABLE'
  | 'APPROXIMATE'
  | 'DISPUTED'
  | 'UNKNOWN';

export type SlotId =
  | 'silhouette'
  | 'sleeves'
  | 'closure'
  | 'inner_chest'
  | 'bottom'
  | 'material_finish'
  | 'footwear'
  | 'outerwear'
  | 'accessories';

export type RiskFlag =
  | 'NONE'
  | 'CORE_ANATOMY_ALTERATION'
  | 'PERFORMANCE_COSTUME_FLAG'
  | 'RECOGNIZABILITY_CHECK'
  | 'CONTEXT_CONFLICT_CHECK'
  | 'UNKNOWN_EVIDENCE_FLAG';

export type RelationType = 'cultural_trait' | 'styling_space';

export interface CuratedOption {
  option_id: string;
  display_name: string;
  slot: SlotId;
  compatible_garments: GarmentId[] | 'ALL';
  default_for_garments: GarmentId[] | 'ALL' | 'NONE';
  relation_type: RelationType;
  trait_level: TraitLevel;
  risk_flag: RiskFlag;
  evidence_refs: string[] | null;
  evidence_status: EvidenceStatus | null;
  requires_eval: boolean;
}

export interface OccasionInfo {
  id: OccasionId;
  name: string;
  tagline: string;
  solemnity: 'Cao (Trang nghiêm)' | 'Trung bình - Cao' | 'Thường nhật';
  description: string;
  historical_context: string;
  iconName: string;
}

export interface RemixIntentInfo {
  id: RemixIntent;
  name: string;
  tagline: string;
  description: string;
  badgeColor: string;
}

export interface GarmentKnowledge {
  id: GarmentId;
  canonical_name: string;
  historical_term: string;
  heritage_term: string;
  definition: string;
  historical_function: string;
  fixed_metadata: {
    collar_type: string;
    collar_display: string;
    body_panels: number;
    closure_side: string;
  };
  traits: {
    essential: string[];
    strongly_characteristic: string[];
    supporting: string[];
    variable: string[];
  };
  sources: string[];
  defaults: {
    silhouette: string;
    sleeves: string;
    closure: string;
    inner_chest: string;
    bottom: string;
    material_finish: string;
    footwear: string;
    outerwear: string;
    accessories: string;
  };
}

export interface LinterEvaluationResult {
  status: LinterStatus;
  reason_code: ReasonCode;
  reasoning_basis: ReasoningBasis;
  impacted_trait: string;
  trait_level: TraitLevel;
  cultural_impact: string;
  context_impact: string;
  evidence_status: EvidenceStatus;
  evidence_anchors: string[];
  creative_suggestion: string | null;
  alternative_action: string | null;
  uncertainty_note: string | null;
}

export interface OutfitState {
  session_id: string;
  state_version: number;
  context: {
    occasion_id: OccasionId;
    occasion_name: string;
    remix_intent: RemixIntent;
  };
  garment_base: GarmentId;
  core_anatomy: {
    silhouette: string;
    sleeves: string;
    closure: string;
  };
  layering_lower: {
    inner_chest: string;
    bottom: string;
  };
  surface_material: {
    material_finish: string;
  };
  contemporary_styling: {
    footwear: string;
    outerwear: string;
    accessories: string;
  };
  active_evaluations: Record<string, LinterEvaluationResult>;
  evaluation_history: Array<{
    request_id: string;
    state_version: number;
    slot: SlotId;
    value: string;
    result: LinterEvaluationResult;
    timestamp: string;
  }>;
}

export interface EvidenceFragment {
  trait_id: string;
  trait_level: TraitLevel;
  claim: string;
  evidence_status: EvidenceStatus;
  source_refs: string[];
}

export interface DossierData {
  visual_outfit_summary: {
    garment_name: string;
    silhouette_label: string;
    sleeves_label: string;
    closure_label: string;
    inner_chest_label: string;
    bottom_label: string;
    material_finish_label: string;
    footwear_label: string;
    outerwear_label: string;
    accessories_label: string;
  };
  overall_cultural_status: LinterStatus;
  what_you_kept: string[];
  what_you_remixed: string[];
  cultural_impact_summary: string;
  contemporary_styling_rationale: string | null;
  evidence_anchors: string[];
  context_note: string;
}

export interface SourceCitation {
  id: string;
  title: string;
  author: string;
  type: string;
  supportedClaims: string;
  reliability: string;
  url?: string;
  institution?: string;
  year?: string;
  locator?: string;
}

// 2-Call Architecture Contracts (Phase 2A)
export type PaletteRole = 'PRIMARY' | 'SUPPORTING' | 'ACCENT';
export type PaletteOrigin = 'USER_REQUESTED' | 'AC_SUGGESTED';

export interface PaletteItem {
  id: string;
  hex: string;
  name: string;
  role: PaletteRole;
  origin?: PaletteOrigin;
}

export interface GarmentRecommendationOutput {
  primary: {
    garmentId: 'ngu_than_chen' | 'ao_tac' | 'ao_tu_than';
    rationale: string; // 1-2 câu giải thích khách quan theo công năng và bối cảnh
  };
  // CHỈ TRẢ VỀ KHI CÓ PHƯƠNG ÁN THỨ HAI THỰC SỰ HỢP LÝ; NẾU KHÔNG TRẢ VỀ NULL
  alternative: {
    garmentId: 'ngu_than_chen' | 'ao_tac' | 'ao_tu_than';
    rationale: string;
  } | null;
}

export type ContextPropType = 'handheld' | 'environmental';
export type ContextPropSource = 'explicit_user_request' | 'approved_system_suggestion';
export type ContextPropFit = 'appropriate' | 'context_sensitive';

export interface ContextProp {
  type: ContextPropType;
  description: string;
  source: ContextPropSource;
  contextFit: ContextPropFit;
}

export interface BlueprintOutput {
  garmentId: 'ngu_than_chen' | 'ao_tac' | 'ao_tu_than';
  remixProposal: {
    palette: PaletteItem[]; // 3 màu chuẩn tạo thành bộ hòa sắc thống nhất
    fabricId: string;
    lowerGarmentId: string;
    footwearId: string;
    accessoryIds: string[];
    contextProps?: ContextProp[];
  };
  contextCautions: string[]; // Lưu ý bối cảnh & nhận diện do AI suy luận
}

export type GenderPresentation = 'nam' | 'nu' | 'neutral';

// Phase 2B & 2B.1: Realistic Lookbook Image Generation Contracts
export interface GenerationSnapshot {
  garmentId: GarmentId;
  genderPresentation?: GenderPresentation;
  palette: Array<{
    id: string;
    role: PaletteRole;
    hex?: string;
    name?: string;
    origin?: PaletteOrigin;
  }>;
  fabricId: string;
  lowerGarmentId: string;
  footwearId: string;
  activeAccessoryIds: string[];
  contextProps?: ContextProp[];
  committedContextSnapshot?: {
    promptText?: string;
    occasion: string;
    style: string;
    traditionalRatio: number;
    genderPresentation?: GenderPresentation;
  };
  boundFingerprint: string;
}

export interface GenerateLookbookRequest {
  garmentId: GarmentId;
  genderPresentation?: GenderPresentation;
  remixProposal: {
    palette: PaletteItem[];
    fabricId: string;
    lowerGarmentId: string;
    footwearId: string;
    accessoryIds: string[]; // ACTIVE accessories only
    contextProps?: ContextProp[];
  };
  context: {
    occasion: string;
    style: string;
    traditionalRatio: number;
    userStyleIntent?: string;
    genderPresentation?: GenderPresentation;
  };
  outfitFingerprint: string;
  forceRegenerate?: boolean;
  revisionIndex?: number; // 0 for base v0, 1 for v1, 2 for v2
  parentGenerationId?: string;
  groundedCorrectionPlan?: GroundedCorrectionPlan;
}

export interface GenerateLookbookResponse {
  generationId: string;
  imageUrl: string;
  outfitFingerprint: string;
  createdAt: number;
  expiresAt: number;
  revisionIndex?: number;
  parentGenerationId?: string;
}

export type LookbookGenerationState =
  | { status: 'idle' }
  | {
      status: 'generating';
      outfitFingerprint: string;
      snapshot: GenerationSnapshot;
      revisionIndex?: number;
      previousImage?: {
        generationId: string;
        imageUrl: string;
        snapshot?: GenerationSnapshot;
        revisionIndex?: number;
      };
    }
  | {
      status: 'success';
      generationId: string;
      imageUrl: string;
      outfitFingerprint: string;
      createdAt: number;
      expiresAt: number;
      snapshot: GenerationSnapshot;
      revisionIndex?: number;
      parentGenerationId?: string;
    }
  | {
      status: 'error';
      code: string;
      message: string;
      outfitFingerprint: string;
      snapshot?: GenerationSnapshot;
      revisionIndex?: number;
      previousImage?: {
        generationId: string;
        imageUrl: string;
        snapshot?: GenerationSnapshot;
        revisionIndex?: number;
      };
    }
  | {
      status: 'expired';
      outfitFingerprint: string;
      snapshot?: GenerationSnapshot;
      revisionIndex?: number;
      message?: string;
    }
  | {
      status: 'interrupted';
      outfitFingerprint?: string;
      snapshot?: GenerationSnapshot;
      revisionIndex?: number;
      message: string;
    };

// =========================================================================
// PHASE 2C: CULTURAL VISUAL QA & AUDIT PIPELINE DATA CONTRACTS
// =========================================================================

export type TraitVerdict = 'PASS' | 'PARTIAL' | 'FAIL' | 'NOT_ASSESSABLE';

export type CulturalIdentityStatus =
  | 'PRESERVES_IDENTITY'
  | 'CONTEXT_SENSITIVE'
  | 'WEAKENS_RECOGNIZABILITY'
  | 'CHANGES_CORE_IDENTIFICATION'
  | 'INSUFFICIENT_EVIDENCE';

export interface RawTraitEvidence {
  traitId: string;
  verdict: TraitVerdict;
  visualEvidence: string;
  observedDeviation?: string;
}

export interface RawOutfitFidelityEvidence {
  palette: {
    primaryMatch: TraitVerdict;
    supportingMatch: TraitVerdict;
    accentMatch: TraitVerdict;
    notes?: string;
  };
  fabricMatch: TraitVerdict;
  lowerGarmentMatch: TraitVerdict;
  footwearMatch: TraitVerdict;
  expectedAccessories: Array<{
    accessoryId: string;
    verdict: TraitVerdict;
    notes?: string;
  }>;
  unexpectedAccessories: string[];
}

export interface EvaluatedTraitItem extends RawTraitEvidence {
  category: 'essential' | 'strongly_characteristic' | 'supporting' | 'variable';
  traitNameVi: string;
  evidence_status?: EvidenceStatus;
  source_refs?: string[];
}

export interface CulturalVisualQAOutput {
  generationId: string;
  boundFingerprint: string;
  auditedAt: number;
  versions: {
    qaSchemaVersion: string;
    culturalKnowledgeVersion: string;
    visualAuditPolicyVersion: string;
  };
  culturalIdentity: {
    overallStatus: CulturalIdentityStatus;
    statusLabelVi: string;
    assessableTraitsCount: number;
    totalTraitsCount: number;
    traits: EvaluatedTraitItem[];
  };
  outfitFidelity: {
    overallFidelity: 'PASS' | 'PARTIAL' | 'FAIL';
    details: RawOutfitFidelityEvidence;
  };
  groundedCorrectionPlan?: GroundedCorrectionPlan;
}

export interface GroundedCorrectionPlan {
  culturalDeltas: Array<{
    traitId: string;
    traitNameVi: string;
    category: 'essential' | 'strongly_characteristic' | 'supporting' | 'variable';
    verdict: TraitVerdict;
    observedDeviation?: string;
    canonicalGuidance: string;
  }>;
  fidelityDeltas: Array<{
    element: 'palette' | 'fabric' | 'lowerGarment' | 'footwear' | 'accessories';
    description: string;
    expectedValue: string;
  }>;
  actionableDeltas?: Array<{
    type: 'cultural' | 'fidelity';
    id: string;
    name: string;
    guidance: string;
    deviation?: string;
  }>;
  preservationConstraints: string[];
  revisionTargetSummary: string;
}

export interface TraitTransition {
  traitId: string;
  traitNameVi: string;
  category: 'essential' | 'strongly_characteristic' | 'supporting' | 'variable';
  previousVerdict?: TraitVerdict;
  currentVerdict: TraitVerdict;
  direction: 'IMPROVED' | 'MAINTAINED_PASS' | 'REGRESSED' | 'UNCHANGED_NON_PASS' | 'NOT_ASSESSABLE';
}

export interface LookbookRevisionItem {
  generationId: string;
  revisionIndex: number; // 0 = v0 (gốc), 1 = v1 (tinh chỉnh 1), 2 = v2 (tinh chỉnh 2)
  imageUrl: string;
  createdAt: number;
  expiresAt: number;
  boundFingerprint: string;
  snapshot: GenerationSnapshot;
  qaResult?: CulturalVisualQAOutput;
  correctionPlan?: GroundedCorrectionPlan;
}

export interface OutfitGenerationThread {
  boundFingerprint: string;
  garmentId: GarmentId;
  activeRevisionIndex: number; // 0, 1, 2
  revisions: LookbookRevisionItem[];
  createdAt: number;
  lastUpdatedAt: number;
}

export interface VerifyLookbookRequest {
  generationId: string;
  boundFingerprint: string;
}

export type VisualQAState =
  | { status: 'idle' }
  | { status: 'loading'; generationId: string }
  | { status: 'success'; generationId: string; result: CulturalVisualQAOutput }
  | { status: 'error'; generationId: string; code: string; message: string; retryable?: boolean };

export type ExplorationIntent = 'MORE_TRADITIONAL' | 'MORE_REMIXED' | 'ALTERNATIVE';

export interface ExplorationBlueprintResult {
  explorationId: string;
  explorationIntent: ExplorationIntent;
  parentBlueprintFingerprint: string;
  resultingOutfitFingerprint: string;
  blueprint: BlueprintOutput;
  stylingRationale: string;
  changesRelativeToOriginal: string;
  wearerGender?: GenderPresentation;
}

// =========================================================================
// PHASE 3A: AC CHAT ASSISTANT DATA CONTRACTS (READ-ONLY GROUNDED CHAT)
// =========================================================================

export type ACChatAnswerMode =
  | 'CULTURAL_KNOWLEDGE'
  | 'PRODUCT_GUIDANCE'
  | 'CURRENT_LOOK_EXPLANATION'
  | 'INSUFFICIENT_EVIDENCE';

export type ACChatActionType = 'SET_FOOTWEAR' | 'SET_FABRIC' | 'ADD_ACCESSORY' | 'SET_COLOR';

export interface ACChatAction {
  actionId?: string;
  type: ACChatActionType;
  targetValue: string;
  targetValueName?: string;
  label: string;
  description: string;
  isApplied?: boolean;
}

export interface ACChatEvidenceRef {
  sourceId: string;
  evidenceStatus: EvidenceStatus;
  claimId?: string;
  title?: string;
  author?: string;
  institution?: string;
  year?: string;
  url?: string;
}

export interface ACChatResponse {
  answer: string;
  answerMode: ACChatAnswerMode;
  evidenceRefs: ACChatEvidenceRef[];
  action?: ACChatAction;
  relatedCurrentState?: {
    garmentId?: string;
    fingerprint?: string;
    generationId?: string;
  };
}

export interface ACChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  responseMeta?: {
    answerMode: ACChatAnswerMode;
    evidenceRefs: ACChatEvidenceRef[];
    action?: ACChatAction;
    relatedCurrentState?: {
      garmentId?: string;
      fingerprint?: string;
      generationId?: string;
    };
  };
  error?: boolean;
  retryable?: boolean;
}

export interface ACChatRequestPayload {
  message: string;
  chatSessionId?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  contextState?: {
    garmentId?: GarmentId;
    genderPresentation?: GenderPresentation;
    occasion?: string;
    style?: string;
    traditionalRatio?: number;
    promptText?: string;
    blueprint?: BlueprintOutput;
    blueprintSummary?: {
      primaryColorName?: string;
      primaryColorHex?: string;
      fabricName?: string;
      lowerGarmentName?: string;
      accessoryNames?: string[];
      culturalReasoning?: string;
    };
    snapshot?: {
      fingerprint?: string;
      generationId?: string;
      activeAccessoryIds?: string[];
    };
    visualQA?: {
      status?: CulturalIdentityStatus;
      statusLabelVi?: string;
      overallFidelity?: 'PASS' | 'PARTIAL' | 'FAIL';
      nonAssessableTraits?: string[];
      failedTraits?: string[];
      partialTraits?: string[];
      unexpectedAccessories?: string[];
    };
  };
}

export interface ACChatMutatePayload {
  actionId: string;
  currentFingerprint: string;
  chatSessionId: string;
}

export interface ACChatMutateResult {
  nextBlueprint: BlueprintOutput;
  nextFingerprint: string;
  actionId: string;
  action: ACChatAction;
  notice: string;
}



