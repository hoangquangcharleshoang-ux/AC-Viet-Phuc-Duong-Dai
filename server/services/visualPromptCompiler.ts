/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2B: Grounded Visual Prompt Compiler
 *
 * Deterministic compiler from Effective Blueprint + Grounded Cultural Guards -> Natural prose image generation prompt
 *
 * Rules:
 * - Deterministic, NO extra LLM call
 * - Uses validated effective blueprint (only ACTIVE accessories)
 * - Cohesive 3-color palette represented together
 * - Garment-specific structural identity guards strictly enforced
 * - Structural fidelity > editorial posing
 * - Natural prose only: NO markdown headings (like "ESSENTIAL TRAITS") to prevent image models from rendering text
 * - NO unsupported symbolism, NO source citations
 */

import { GarmentId, GenerateLookbookRequest, PaletteItem } from '../../src/types/index';
import {
  FABRICS,
  LOWER_GARMENTS,
  FOOTWEAR,
  ACCESSORIES
} from '../../src/data/canonicalCatalog';

export interface CompiledVisualPrompt {
  prompt: string;
  garmentId: GarmentId;
  outfitFingerprint: string;
}

// 1. Visual Material Descriptions (Canonical ID -> Visual Prompt Representation)
const FABRIC_VISUAL_MAP: Record<string, string> = {
  to_tam_ha_dong: 'traditional handwoven Ha Dong mulberry silk with a refined natural luster and fluid graceful drape',
  gam_hoa_chim: 'structured traditional brocade featuring subtle tone-on-tone woven heritage motifs with a dignified matte-sheen texture',
  sa_to_mong: 'delicate airy gauze silk (sa to) offering an ethereal, breathable semi-translucent texture',
  dui_moc_tu_nhien: 'raw textured slub silk-linen (dui moc) with an organic earthy weave and tactile substance',
  linen_cao_cap: 'premium breathable natural linen with a crisp, modern structured drape and refined weave',
  taffeta_mat: 'subtle matte taffeta holding structured silhouettes with understated elegance',
  lua_to_tam_tron: 'smooth monochrome mulberry silk with a soft fluid cascade and elegant hand'
};

// 2. Visual Lower Garment Descriptions
const LOWER_GARMENT_VISUAL_MAP: Record<string, string> = {
  silk_pants_wide: 'traditional wide-leg white silk trousers falling smoothly to the footwear in classic proportion',
  silk_pants_black: 'classic wide-leg black silk trousers with dignified fluid drape and relaxed comfort',
  tailored_trousers_straight: 'clean minimalist straight-cut tailored trousers in a contemporary tailored silhouette',
  vay_dup_den: 'traditional northern Vietnamese gathered black wrap skirt (vay dup) falling straight and dignified',
  pleated_skirt_long: 'an elegant long pleated maxi skirt offering graceful vertical movement',
  culottes_linen: 'contemporary relaxed wide-leg linen culottes tailored neatly above the ankle'
};

// 3. Visual Footwear Descriptions
const FOOTWEAR_VISUAL_MAP: Record<string, string> = {
  leather_loafer: 'minimalist black polished leather penny loafers with a refined contemporary edge',
  guoc_moc_truyen_thong: 'traditional sculpted wooden clogs (guoc moc) with dark velvet foot straps',
  chunky_sneaker: 'contemporary clean structured chunky sneakers blending modern streetwear with heritage',
  classic_oxford: 'classic formal black leather Oxford dress shoes with subtle stitch detailing',
  mule_minimalist: 'sleek low-heeled minimalist leather mules offering an airy contemporary cadence',
  strappy_sandals: 'refined minimalist thin-strap leather sandals in a quiet monochrome tone'
};

// 4. Visual Accessory Descriptions
const ACCESSORY_VISUAL_MAP: Record<string, string> = {
  khan_dong_truyen_thong: 'a neatly wrapped traditional Vietnamese fabric turban (khan dong) resting squarely on the head',
  khan_mo_qua: 'a traditional black crows-beak headscarf (khan mo qua) precisely folded into a sharp triangular point at the forehead',
  non_thung_quai_thao: 'a wide flat-brimmed traditional northern palm-leaf hat (non quai thao) held gently at the side',
  tui_coton_theu_tay: 'a minimalist natural linen tote bag with delicate hand-embroidered silk thread accents',
  quat_giay_tram_huong: 'a traditional folded bamboo-ribbed paper hand fan held lightly in hand',
  chuoi_ngoc_trai_co: 'a single understated strand of natural freshwater pearls resting elegantly near the collar',
  kinh_ram_gong_tron: 'contemporary slim round-frame dark sunglasses adding a modern urban touch',
  vong_bac_cham_hoa: 'a traditional solid silver engraved collar torque (kieng bac) worn cleanly around the neck',
  tram_cai_toc_toi_gian: 'a single minimalist understated hairpin (tram cai toc toi gian) tucked neatly into hair, restrained geometry with small subtle botanical detail, no hanging tassels, no elaborate phoenix crown styling, no oversized jade chains'
};

/**
 * Compile cohesive 3-color palette into natural descriptive prose
 */
function compilePaletteProse(palette: PaletteItem[]): string {
  if (!Array.isArray(palette) || palette.length === 0) {
    return 'The outfit utilizes a cohesive natural palette with harmonious heritage tones.';
  }

  const primary = palette.find(p => p.role === 'PRIMARY') || palette[0];
  const supporting = palette.find(p => p.role === 'SUPPORTING') || palette[1] || primary;
  const accent = palette.find(p => p.role === 'ACCENT') || palette[2] || supporting;

  return `The outfit uses a cohesive three-color palette: ${primary.name} (${primary.hex}) as the primary dominant color of the main body, ${supporting.name} (${supporting.hex}) as the harmonious supporting tone for complementary garments, and ${accent.name} (${accent.hex}) as a restrained, tasteful accent highlight.`;
}

/**
 * Compile garment-specific structural identity guards
 */
function compileGarmentStructuralGuard(garmentId: GarmentId): string {
  switch (garmentId) {
    case 'ngu_than_chen':
      return 'The primary garment is an authentic Áo ngũ thân tay chẽn (five-panel fitted-sleeve Vietnamese gown). It strictly features an upright Vietnamese lập lĩnh standing collar of historically plausible moderate height, neatly structured and not exaggerated, hugging the base of the neck, an asymmetrical closure fastening gracefully from the collar base down toward the right underarm with traditional buttons, a natural uncinched five-panel straight silhouette that drapes naturally without waist darts, and narrow fitted sleeves (trach tu) that taper neatly along the arms down to the wrists. It must distinctly embody the five-panel heritage construction, not a modern Westernized bodycon áo dài.';

    case 'ao_tac':
      return 'The primary garment is an authentic Áo tấc (Ngũ thân tay thụng ceremonial five-panel gown). It strictly features a dignified upright Vietnamese lập lĩnh standing collar closely fitted at the neck, an asymmetrical traditional fastening to the right underarm, and a spacious five-panel silhouette with a generally longer, fuller ceremonial drape. The sleeves are distinctly cut into broad, generous rectangular sleeves (khoan tu) that remain completely loose, ungathered, and untapered at the wrists with wide open straight cuffs. The construction is formal, spacious, and ceremonial, avoiding any fitted modern áo dài lines, narrowed wrists, cinched waist, or blazer-like cuts.';

    case 'ao_tu_than':
      return 'The primary garment is an authentic Áo tứ thân (traditional four-panel northern Vietnamese ensemble). The outer coat is built from four distinct fabric panels with the center-back seam joined and the two front panels remaining completely OPEN, hanging gracefully or loosely tied at the waist without any center buttons, zippers, or high-neck closure. Underneath the open front panels, a separate traditional halter-style inner bodice (áo yếm) is tastefully layered over the chest, preserving the historic layered structure of northern folk dress. The front must not be closed into a generic high-collared dress.';

    default:
      return 'The garment strictly preserves traditional Vietnamese tailoring construction with authentic collar, closure, and panel proportions.';
  }
}

/**
 * Main Visual Prompt Compiler
 */
export function compileVisualPrompt(request: GenerateLookbookRequest): CompiledVisualPrompt {
  const { garmentId, remixProposal, context, outfitFingerprint } = request;

  const gender = request.genderPresentation || context?.genderPresentation || 'nam';
  const modelGenderDesc = gender === 'nu' ? 'female model' : gender === 'neutral' ? 'model (gender-neutral presentation)' : 'male model';

  const identityLockProse = gender === 'nu'
    ? 'Maintain strict gender and facial identity continuity: a female Vietnamese model with consistent facial presentation and styling.'
    : gender === 'neutral'
    ? 'Maintain strict identity continuity: a Vietnamese model with consistent neutral presentation and styling.'
    : 'Maintain strict gender and facial identity continuity: a male Vietnamese model with consistent facial presentation and styling.';

  // 1. Photography Baseline
  const baselineIntro =
    `Photorealistic full-body fashion lookbook photograph. One Vietnamese ${modelGenderDesc} wearing the specified Vietnamese traditional outfit. Neutral standing pose, front or subtle three-quarter view. The complete garment construction must remain clearly visible from collar to footwear. Natural relaxed posture, arms resting gently at sides so sleeve geometry and closure details are completely unobstructed. Soft natural daylight, clean neutral architectural or minimalist studio backdrop with subtle warm tones. High-quality realistic textile texture, authentic weave, realistic human anatomy. Structural garment fidelity takes absolute priority over flattering body shaping or dramatic fashion editorial poses. ${identityLockProse} No text, no captions, no typography, no labels, no logos, no watermarks, no graphic design overlays.`;

  // 2. Garment Structural Guard
  const structuralGuard = compileGarmentStructuralGuard(garmentId);

  // 3. Cohesive Palette
  const paletteProse = compilePaletteProse(remixProposal.palette);

  // 4. Fabric & Material
  const fabricVisual =
    FABRIC_VISUAL_MAP[remixProposal.fabricId] ||
    `quality traditional textile fabric (${remixProposal.fabricId})`;
  const fabricProse = `The main body is tailored from ${fabricVisual}, accentuating clean lines and natural structural drape.`;

  // 5. Lower Garment
  const lowerVisual =
    LOWER_GARMENT_VISUAL_MAP[remixProposal.lowerGarmentId] ||
    `coordinated trousers (${remixProposal.lowerGarmentId})`;
  const lowerProse = `Paired underneath with ${lowerVisual}.`;

  // 6. Footwear
  const footwearVisual =
    FOOTWEAR_VISUAL_MAP[remixProposal.footwearId] ||
    `coordinated classic footwear (${remixProposal.footwearId})`;
  const footwearProse = `Completed with ${footwearVisual}.`;

  // 7. Active Wearable Accessories & Contextual Props (Separated Channels)
  const activeAccessories = Array.isArray(remixProposal.accessoryIds)
    ? remixProposal.accessoryIds.filter(id => id && id.trim().length > 0)
    : [];

  const contextProps = Array.isArray(remixProposal.contextProps)
    ? remixProposal.contextProps
    : [];

  const handheldProps = contextProps.filter(p => p.type === 'handheld');
  const environmentalProps = contextProps.filter(p => p.type === 'environmental');

  let accessoryProse = '';
  if (activeAccessories.length === 0) {
    accessoryProse =
      'No wearable fashion accessories (such as bags, turbans, scarfs, jewelry, or sunglasses) are worn; the outfit styling emphasizes clean minimalism.';
  } else {
    const accessoryDescriptions = activeAccessories
      .map(id => ACCESSORY_VISUAL_MAP[id] || `refined accessory (${id})`)
      .join(' and ');
    accessoryProse = `Styled thoughtfully with wearable accessories: ${accessoryDescriptions}. Do not add any other unrequested wearable fashion accessories.`;
  }

  let propProse = '';
  if (contextProps.length === 0) {
    propProse = 'No handheld props or environmental scene items are present. The model holds no objects in hand and no extra scene props are placed.';
  } else {
    const parts: string[] = [];
    if (handheldProps.length > 0) {
      const handheldDescs = handheldProps.map(p => p.description).join(' and ');
      parts.push(`The model holds the following approved contextual handheld prop cleanly: ${handheldDescs}. Do not add any unapproved handheld objects or beverage cans other than specified.`);
    }
    if (environmentalProps.length > 0) {
      const envDescs = environmentalProps.map(p => p.description).join(' and ');
      parts.push(`The surrounding scene includes approved contextual environmental props: ${envDescs}.`);
    }
    propProse = parts.join(' ');
  }

  // 8. Hairstyle Policy & Natural Grooming (Cultural Product Rules v1.1 §10)
  const hasHeadwear = activeAccessories.some(id => id === 'khan_dong_truyen_thong' || id === 'khan_mo_qua');
  const hairstyleProse = hasHeadwear
    ? 'Hairstyle is neatly arranged to accommodate the specified traditional headwear cleanly without extra ribbons or ornaments.'
    : gender === 'nu'
    ? 'Hairstyle is natural and understated: clean natural long hair, simple contemporary low bun, or neat tied-back hair with zero ornate hairpins or fantasy hair jewelry.'
    : gender === 'neutral'
    ? 'Hairstyle is clean, neat, and natural with zero fantasy ornaments or elaborate styling.'
    : 'Hairstyle is a neat natural contemporary haircut, clean and unadorned with zero topknots or fantasy headdresses.';

  // 9. Strict Cultural Guardrails & No-Invention Directives (Cultural Product Rules v1.1 §11)
  const culturalSafetyGuards =
    'STRICT NO-INVENTION GUARD: Render ONLY the styling elements and explicit contextual props specified in this brief. Strictly DO NOT add or invent unrequested crowns, imperial headpieces, royal regalia, jade pendants (ngọc bội / kim bội), pearl necklaces, ornate hairpins (trâm), handheld fans, scepters, umbrellas, or ceremonial props that are not explicitly approved in this brief. Avoid vague fantasy tropes such as ancient Asian costume, oriental royal accessories, or fantasy imperial styling. Strictly preserve authentic Vietnamese garment tailoring without Chinese Hanfu, Korean Hanbok, or generic East Asian cross-cultural elements.';

  // 10. Styling Mood / Context (Restrained, sanitized, clamped, pre-commit prompt stripped)
  let stylingMood = '';
  if (context?.userStyleIntent && typeof context.userStyleIntent === 'string') {
    let sanitizedIntent = context.userStyleIntent.trim().replace(/[\r\n\t]+/g, ' ').slice(0, 150);

    // Strip out unapproved commercial beverage or food keywords if present in refinement input
    if (contextProps.length === 0) {
      sanitizedIntent = sanitizedIntent
        .replace(/lon\s+coca\s*cola|coca\s*cola|coca|pepsi|lon\s+nước\s+ngọt|nước\s+ngọt|lon\s+bia|chái\s+nước/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (sanitizedIntent.length > 0) {
      stylingMood = `Contemporary styling refinement directive: "${sanitizedIntent}". Note: This refinement directive MUST NOT introduce any unapproved accessories or structural modifications prohibited by the committed Blueprint.`;
    }
  }

  // Combine into clean natural prose paragraphs
  const promptParts = [
    baselineIntro,
    structuralGuard,
    paletteProse,
    fabricProse,
    lowerProse,
    footwearProse,
    accessoryProse,
    propProse,
    hairstyleProse,
    culturalSafetyGuards
  ];

  if (stylingMood) {
    promptParts.push(stylingMood);
  }

  // 9. Grounded Correction Directives (Phase 2C Revision Loop)
  if (request.revisionIndex && request.revisionIndex > 0 && request.groundedCorrectionPlan) {
    const plan = request.groundedCorrectionPlan;
    const revisionDirectives: string[] = [];

    // Cultural Deltas (FAIL or PARTIAL traits)
    if (plan.culturalDeltas && plan.culturalDeltas.length > 0) {
      const culturalNotes = plan.culturalDeltas.map(d =>
        `CULTURAL CORRECTION [${d.traitId} - ${d.traitNameVi}]: Rectify previously observed deviation "${d.observedDeviation || 'inaccurate geometry'}". You MUST strictly render: ${d.canonicalGuidance}`
      );
      revisionDirectives.push(`CRITICAL CULTURAL REVISIONS (REVISION ${request.revisionIndex}):\n${culturalNotes.join('\n')}`);
    }

    // Outfit Fidelity Deltas
    if (plan.fidelityDeltas && plan.fidelityDeltas.length > 0) {
      const fidelityNotes = plan.fidelityDeltas.map(f =>
        `STYLING FIDELITY CORRECTION [${f.element}]: ${f.description} Explicitly enforce: ${f.expectedValue}`
      );
      revisionDirectives.push(`STYLING FIDELITY REVISIONS:\n${fidelityNotes.join('\n')}`);
    }

    // Locked Preservation Constraints
    if (plan.preservationConstraints && plan.preservationConstraints.length > 0) {
      revisionDirectives.push(`LOCKED PRESERVATION CONSTRAINTS (DO NOT ALTER):\n${plan.preservationConstraints.join('\n')}`);
    }

    if (revisionDirectives.length > 0) {
      promptParts.push(revisionDirectives.join('\n\n'));
    }
  }

  const prompt = promptParts.join('\n\n');

  return {
    prompt,
    garmentId,
    outfitFingerprint
  };
}

export function compileRevisionVisualPrompt(
  request: GenerateLookbookRequest
): CompiledVisualPrompt {
  return compileVisualPrompt(request);
}

