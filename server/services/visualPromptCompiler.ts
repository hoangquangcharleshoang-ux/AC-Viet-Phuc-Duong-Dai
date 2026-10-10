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
 * - Studio background clean & bright, no architecture/columns
 * - Model youthful (20-24 university student vibe), photogenic, friendly
 * - Natural prose only: NO markdown headings to prevent image models from rendering text
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
export const FABRIC_VISUAL_MAP: Record<string, string> = {
  natural_matte_silk_linen: 'natural silk, đũi, or linen-family textile with a refined matte surface, subtle organic weave, gentle natural texture, and soft-to-moderate vertical drape',
  to_tam_ha_dong: 'traditional handwoven Ha Dong mulberry silk with a refined natural luster and fluid graceful drape',
  gam_hoa_chim: 'structured traditional brocade featuring subtle tone-on-tone woven heritage motifs with a dignified matte-sheen texture',
  sa_to_mong: 'delicate airy gauze silk (sa to) offering an ethereal, breathable semi-translucent texture',
  dui_moc_tu_nhien: 'raw textured slub silk-linen (dui moc) with an organic earthy weave and tactile substance',
  linen_cao_cap: 'natural breathable linen with a visible fine weave, matte surface, soft-to-moderate body, natural vertical fall, subtle real fabric wrinkles, and realistic textile weight',
  taffeta_mat: 'subtle matte taffeta holding structured silhouettes with understated elegance, without synthetic shine or rigid costume appearance',
  lua_to_tam_tron: 'smooth monochrome mulberry silk with a soft fluid cascade and elegant hand'
};

// 2. Visual Lower Garment Descriptions
export const LOWER_GARMENT_VISUAL_MAP: Record<string, string> = {
  silk_pants_wide: 'traditional wide-leg white silk trousers falling smoothly to the footwear in classic proportion',
  silk_pants_black: 'classic wide-leg black silk trousers with dignified fluid drape and relaxed comfort',
  tailored_trousers_straight: 'clean minimalist straight-cut tailored trousers in a contemporary tailored silhouette',
  vay_dup_den: 'traditional northern Vietnamese gathered black wrap skirt (vay dup) falling straight and dignified',
  pleated_skirt_long: 'an elegant long pleated maxi skirt offering graceful vertical movement',
  culottes_linen: 'contemporary relaxed wide-leg linen culottes tailored neatly above the ankle'
};

// 3. Visual Footwear Descriptions
export const FOOTWEAR_VISUAL_MAP: Record<string, string> = {
  leather_loafer: 'minimalist black polished leather penny loafers with a refined contemporary edge',
  guoc_moc: 'traditional sculpted wooden clogs (guoc moc) with dark velvet foot straps',
  guoc_moc_truyen_thong: 'traditional sculpted wooden clogs (guoc moc) with dark velvet foot straps',
  chunky_sneaker: 'contemporary clean structured chunky sneakers blending modern streetwear with heritage',
  classic_oxford: 'classic formal black leather Oxford dress shoes with subtle stitch detailing',
  mule_minimalist: 'sleek low-heeled minimalist leather mules offering an airy contemporary cadence',
  strappy_sandals: 'refined minimalist thin-strap leather sandals in a quiet monochrome tone'
};

// 4. Visual Accessory Descriptions
export const ACCESSORY_VISUAL_MAP: Record<string, string> = {
  khan_dong: 'a neatly wrapped traditional Vietnamese fabric turban (khan dong) resting squarely on the head',
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
 * Compile cohesive 3-color palette into natural descriptive prose with garment-aware accent placement and high perceptual visibility
 */
function compilePaletteProse(palette: PaletteItem[], garmentId: GarmentId): string {
  if (!Array.isArray(palette) || palette.length === 0) {
    return 'The outfit utilizes a cohesive natural palette with harmonious heritage tones.';
  }

  const primary = palette.find(p => p.role === 'PRIMARY') || palette[0];
  const supporting = palette.find(p => p.role === 'SUPPORTING') || palette[1] || primary;
  const accent = palette.find(p => p.role === 'ACCENT') || palette[2] || supporting;

  let accentPlacement = '';
  if (garmentId === 'ngu_than_chen') {
    accentPlacement = 'For this Áo ngũ thân tay chẽn, concentrate the accent into clearly visible traditional closure/button details, a restrained small woven motif cluster, or secondary textile details where Blueprint permits.';
  } else if (garmentId === 'ao_tac') {
    accentPlacement = 'For this Áo tấc, concentrate the accent into clearly visible traditional closure/button details, restrained woven or brocade motif clusters, or a validated Blueprint accessory detail if that accessory already exists in the validated Blueprint.';
  } else if (garmentId === 'ao_tu_than') {
    accentPlacement = 'For this Áo tứ thân, the accent may be more visibly expressed through a validated inner yếm, waist sash, or compatible accessory already selected in Blueprint.';
  } else {
    accentPlacement = 'Concentrate the accent into one or two culturally appropriate, visually meaningful areas rather than scattering it across the outfit.';
  }

  return `The outfit uses a cohesive three-color palette: ${primary.name} (${primary.hex}) as the primary dominant color of the main body, ${supporting.name} (${supporting.hex}) as the harmonious supporting tone for complementary garments, and ${accent.name} (${accent.hex}) as an intentional focal contrast highlight with clear focal contrast. The accent color remains clearly perceptible and secondary to the primary garment color, but it must be immediately recognizable in a full-body view without zooming. Use one concentrated focal accent zone or a small repeated motif cluster with enough saturation, contrast, and visible area to register clearly at first glance. The accent should remain substantially smaller than the primary color, but it must NOT be reduced to nearly invisible pinpoints. Target: small area, high perceptual visibility. ${accentPlacement} The accent must NOT become contrast piping, colored seam outlining, collar outlining, front closure outlining, cuff outlining, hem outlining, or decorative edge borders. Absolutely NO contrast piping, NO colored seam outlining, NO pajama-style edge trim, and NO decorative tracing along the asymmetrical closure.`;
}

/**
 * Compile garment-specific structural identity guards and pose directives
 */
function compileGarmentStructuralGuard(garmentId: GarmentId): string {
  switch (garmentId) {
    case 'ngu_than_chen':
      return 'GARMENT CONSTRUCTION & POSE (ÁO NGŨ THÂN TAY CHẼN): The primary garment is an authentic Áo ngũ thân tay chẽn (five-panel fitted-sleeve Vietnamese gown). It strictly features an upright Vietnamese lập lĩnh standing collar of historically plausible moderate height hugging the base of the neck, an asymmetrical right-side closure fastening gracefully from the collar base down toward the right underarm with traditional fabric buttons, a natural uncinched straight five-panel drape falling below the knees, and narrow fitted sleeves (trách tụ) that visibly taper progressively from a roomier upper sleeve/armpit down toward the wrists. The right-side closure must be read through actual closure structure and buttons, NOT through contrast piping or colored trim. Visually modest side openings below the hips. POSE DIRECTIVE: Dignified standing pose with arms relaxed but slightly separated from torso to reveal the tapered sleeve geometry, right-side closure path, and straight five-panel body silhouette. Hands must not cover the right-side fastening path. It distinctly embodies historic five-panel heritage construction, clean and student-appropriate, not a Westernized bodycon áo dài, not a kurta or sherwani.';

    case 'ao_tac':
      return 'GARMENT CONSTRUCTION & POSE (ÁO TẤC): The primary garment is an authentic Áo tấc (Ngũ thân tay thụng ceremonial five-panel gown). It strictly features a dignified upright Vietnamese lập lĩnh standing collar closely fitted at the neck, an asymmetrical traditional fastening to the right underarm, and a spacious five-panel ceremonial silhouette with fuller drape. The sleeves are distinctly cut into broad, generous rectangular sleeves (khoán tụ) that remain completely loose, ungathered, and untapered at the wrists with wide open straight cuffs. POSE DIRECTIVE: Dignified ceremonial standing pose, hands gently composed in front or naturally positioned while ensuring both broad rectangular sleeves remain clearly readable and uncollapsed against the torso. The construction is formal, spacious, and traditional, avoiding any fitted modern áo dài lines, narrowed wrists, cinched waist, or blazer-like cuts.';

    case 'ao_tu_than':
      return 'GARMENT CONSTRUCTION & POSE (ÁO TỨ THÂN): The primary garment is an authentic Áo tứ thân (traditional four-panel northern Vietnamese ensemble). The outer coat is built from four distinct fabric panels with the center-back seam joined and the two front panels remaining completely OPEN, hanging gracefully or loosely tied at the waist without any center buttons, chest button row, zippers, or high-neck closure. Underneath the open front panels, a separate traditional halter-style inner bodice (áo yếm) is tastefully layered over the chest, along with a separate waist sash. POSE DIRECTIVE: Natural graceful stance clearly showing the open front panels, separate inner yếm, and waist sash without covering the waist or chest entirely. The outer coat must not fuse into one modern dress, yếm must not become a printed fake neckline.';

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
  const occasion = context?.occasion || '';
  const style = context?.style || 'tre_trung';
  const traditionalRatio = typeof context?.traditionalRatio === 'number' ? context.traditionalRatio : 50;

  // 1. GARMENT STRUCTURAL GUARD & POSE DIRECTIVE (HIGHEST PRIORITY AT TOP OF PROMPT)
  const structuralGuard = compileGarmentStructuralGuard(garmentId);

  // 2. High-Level Image Goal & Model Profile
  const modelGenderDesc = gender === 'nu' ? 'female model' : gender === 'neutral' ? 'model (gender-neutral presentation)' : 'male model';
  const identityLockProse = gender === 'nu'
    ? 'Maintain strict gender and facial identity continuity: a young female Vietnamese model with consistent facial presentation and styling.'
    : gender === 'neutral'
    ? 'Maintain strict identity continuity: a young Vietnamese model with consistent neutral presentation and styling.'
    : 'Maintain strict gender and facial identity continuity: a handsome young male Vietnamese model with consistent facial presentation and styling.';

  const isGraduationContext = occasion === 'ky_yeu' || occasion.includes('ky_yeu') || occasion.includes('tot_nghiep');

  let modelProfile = '';
  if (gender === 'nam') {
    modelProfile =
      'MODEL PROFILE: A handsome, youthful Vietnamese young man, approximately university age (around 20–24 years old). Neat student-like appearance, clean grooming, fresh-faced skin, calm confident friendly expression with a subtle natural smile.';
  } else if (gender === 'nu') {
    modelProfile =
      'MODEL PROFILE: A beautiful, youthful Vietnamese young woman, approximately university age (around 20–24 years old). Fresh elegant photogenic appearance, clean radiant skin, soft natural makeup, and a bright, pleasant, graceful expression with a gentle smile.';
  } else {
    modelProfile =
      'MODEL PROFILE: A youthful Vietnamese model, approximately university age (around 20–24 years old), clean photogenic appearance and a friendly relaxed expression.';
  }

  if (isGraduationContext) {
    modelProfile += ' Context: University graduation yearbook lookbook, youthful, celebratory, student-appropriate.';
  }

  // 3. BACKGROUND & LIGHTING (PREMIUM EDITORIAL TEXTILE DEPTH)
  const backgroundAndLighting =
    'STUDIO & LIGHTING: Premium editorial fashion photography with visible material depth at full-body scale and dimensional textile rendering. Clean, bright, minimal editorial studio with a plain, seamless warm-ivory or soft-cream backdrop. Use soft directional key light from approximately 30–45 degrees with gentle fill and controlled contrast. Preserve natural skin tones while clearly revealing fabric weave, folds, textile weight, natural drape, subtle raised woven texture, restrained material sheen, and depth between overlapping garment layers. Avoid flat ecommerce lighting. The fabric surface should remain readable even from full-body framing. Strictly NO dark, theatrical, cinematic, or high-drama lighting. Strictly NO architectural backdrops, columns, arches, hallways, stairs, temple structures, furniture, plants, or room interiors.';

  // 4. Cohesive Palette & Accent Piping Policy
  const paletteProse = compilePaletteProse(remixProposal.palette, garmentId);

  // 5. Fabric & Material with material-specific rendering & textile depth
  const fabricVisual =
    FABRIC_VISUAL_MAP[remixProposal.fabricId] ||
    'quality traditional textile fabric';
  let materialSpecificDetail = '';
  const fId = remixProposal.fabricId || '';
  if (fId.includes('silk') || fId.includes('lua') || fId.includes('to_tam') || fId.includes('sa_to')) {
    materialSpecificDetail = ' MATERIAL DETAIL: Soft natural luster, fine visible weave, fluid drape, controlled highlights, and no synthetic satin shine.';
  } else if (fId.includes('gam')) {
    let brocadeExtra = '';
    if (garmentId === 'ao_tac') {
      brocadeExtra = ' The brocade surface should show subtle woven motif depth through directional light and tonal variation. Motifs remain refined and restrained, but should be visible enough to give the garment a premium ceremonial texture.';
    }
    materialSpecificDetail = ` MATERIAL DETAIL: Subtle woven depth, low-relief motifs visible through light, restrained tonal patterning, dimensional woven surface, no costume-like metallic shine.${brocadeExtra}`;
  } else if (fId.includes('linen') || fId.includes('dui') || fId.includes('natural_matte_silk_linen')) {
    materialSpecificDetail = ' MATERIAL DETAIL: Matte tactile weave, subtle natural wrinkles, believable textile weight, and organic surface variation.';
  }

  const fabricProse = `FABRIC: Tailored from ${fabricVisual}, accentuating clean lines and natural structural drape.${materialSpecificDetail}`;

  // 6. Lower Garment
  const lowerVisual =
    LOWER_GARMENT_VISUAL_MAP[remixProposal.lowerGarmentId] ||
    'coordinated lower garment';
  const lowerProse = `LOWER GARMENT: Paired underneath with ${lowerVisual}.`;

  // 7. Footwear
  const footwearVisual =
    FOOTWEAR_VISUAL_MAP[remixProposal.footwearId] ||
    'coordinated footwear';
  const footwearProse = `FOOTWEAR: Completed with ${footwearVisual}.`;

  // 8. Active Wearable Accessories & Contextual Props
  const activeAccessories = Array.isArray(remixProposal.accessoryIds)
    ? remixProposal.accessoryIds.filter(id => id && id.trim().length > 0 && id !== 'accessories_none')
    : [];

  const contextProps = Array.isArray(remixProposal.contextProps)
    ? remixProposal.contextProps
    : [];

  const handheldProps = contextProps.filter(p => p.type === 'handheld');
  const environmentalProps = contextProps.filter(p => p.type === 'environmental');

  let accessoryProse = '';
  if (activeAccessories.length === 0) {
    accessoryProse =
      'ACCESSORIES: No wearable fashion accessories (no bags, turbans, scarfs, jewelry, or sunglasses) are worn. Clean minimalism.';
  } else {
    const accessoryDescriptions = activeAccessories
      .map(id => ACCESSORY_VISUAL_MAP[id] || `refined accessory`)
      .join(' and ');
    accessoryProse = `ACCESSORIES: Styled with ${accessoryDescriptions}. Do not add any other unrequested wearable fashion accessories.`;
  }

  let propProse = '';
  if (contextProps.length === 0) {
    propProse = 'PROPS: No handheld props or environmental scene items are present. The model holds no objects in hand.';
  } else {
    const parts: string[] = [];
    if (handheldProps.length > 0) {
      const handheldDescs = handheldProps.map(p => p.description).join(' and ');
      parts.push(`PROPS: Model holds approved contextual handheld prop: ${handheldDescs}.`);
    }
    if (environmentalProps.length > 0) {
      const envDescs = environmentalProps.map(p => p.description).join(' and ');
      parts.push(`Scene includes approved environmental props: ${envDescs}.`);
    }
    propProse = parts.join(' ');
  }

  // 9. Hairstyle Policy
  const hasHeadwear = activeAccessories.some(id => id === 'khan_dong' || id === 'khan_dong_truyen_thong' || id === 'khan_mo_qua');
  const hairstyleProse = hasHeadwear
    ? 'HAIRSTYLE: Arranged neatly under traditional headwear cleanly without extra ribbons or ornaments.'
    : gender === 'nu'
    ? 'HAIRSTYLE: Clean natural long hair, simple contemporary low bun, or neat tied-back hair with zero ornate hairpins or fantasy hair jewelry. Hairstyle is natural and understated.'
    : gender === 'neutral'
    ? 'HAIRSTYLE: Clean, neat, and natural with zero fantasy ornaments. Hairstyle is natural and understated.'
    : 'HAIRSTYLE: Neat natural contemporary haircut, clean and unadorned with zero topknots or fantasy headdresses.';

  // 10. Art Direction via Style & Traditional Ratio
  let artDirectionProse = `ART DIRECTION (Ratio: ${traditionalRatio}%, Style: ${style}): `;
  if (traditionalRatio >= 70) {
    artDirectionProse += 'Heritage-forward styling with restrained modern intervention; traditional silhouette dominates with authentic dignity.';
  } else if (traditionalRatio >= 40) {
    artDirectionProse += 'Balanced contemporary refinement; core traditional garment strongly preserved with clean modern styling.';
  } else {
    artDirectionProse += 'Contemporary color and styling expression while keeping core garment anatomy completely intact.';
  }

  // 11. HARD NEGATIVE CONSTRAINTS (CONSOLIDATED)
  const culturalSafetyGuards =
    'HARD NEGATIVE CONSTRAINTS & STRICT NO-INVENTION GUARD: Strictly DO NOT add or invent unrequested crowns, royal regalia, jade pendants, or pearl necklaces. Avoid vague fantasy tropes such as ancient Asian costume, Hanfu, Hanbok, kurta, or sherwani. Strictly NO contrast piping, NO colored seam outlining, NO pajama-style edge trim, NO decorative tracing along asymmetrical closure, NO decorative tracing along collar, NO colored hem outlining, NO high side slits, NO bodycon modern áo dài, NO architectural backdrops (columns, arches, stairs, temples), NO furniture or plants, NO dark or moody lighting, NO sunglasses unless explicitly specified, NO middle-aged facial features. Render ONLY specified items.';

  // 12. User Style Intent
  let stylingMood = '';
  if (context?.userStyleIntent && typeof context.userStyleIntent === 'string') {
    let sanitizedIntent = context.userStyleIntent.trim().replace(/[\r\n\t]+/g, ' ').slice(0, 150);

    if (contextProps.length === 0) {
      sanitizedIntent = sanitizedIntent
        .replace(/lon\s+coca\s*cola|coca\s*cola|coca|pepsi|lon\s+nước\s+ngọt|nước\s+ngọt|lon\s+bia|chái\s+nước/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (sanitizedIntent.length > 0) {
      stylingMood = `REFINEMENT DIRECTIVE: "${sanitizedIntent}". Must NOT introduce prohibited structural modifications or unapproved accessories.`;
    }
  }

  const baselineIntro = `Photorealistic full-body fashion lookbook photograph of one Vietnamese ${modelGenderDesc}. Single subject in neutral standing pose. Full garment visible from collar to footwear. ${identityLockProse} No text, no captions, no typography, no watermarks.`;

  // Combine into clean natural prose paragraphs (GARMENT FIRST)
  const promptParts = [
    structuralGuard,
    baselineIntro,
    modelProfile,
    backgroundAndLighting,
    paletteProse,
    fabricProse,
    lowerProse,
    footwearProse,
    accessoryProse,
    propProse,
    hairstyleProse,
    artDirectionProse,
    culturalSafetyGuards
  ];

  if (stylingMood) {
    promptParts.push(stylingMood);
  }

  // Grounded Correction Directives (Phase 2C Revision Loop)
  if (request.revisionIndex && request.revisionIndex > 0) {
    const plan = request.groundedCorrectionPlan;
    const revisionDirectives: string[] = [];

    if (plan?.culturalDeltas && plan.culturalDeltas.length > 0) {
      const culturalNotes = plan.culturalDeltas.map(d =>
        `CULTURAL CORRECTION [${d.traitId} - ${d.traitNameVi}]: Rectify observed deviation "${d.observedDeviation || 'inaccurate geometry'}". You MUST strictly render: ${d.canonicalGuidance}`
      );
      revisionDirectives.push(`CRITICAL CULTURAL REVISIONS (REVISION ${request.revisionIndex}):\n${culturalNotes.join('\n')}`);
    }

    if (plan?.fidelityDeltas && plan.fidelityDeltas.length > 0) {
      const fidelityNotes = plan.fidelityDeltas.map(f =>
        `STYLING FIDELITY CORRECTION [${f.element}]: ${f.description} Explicitly enforce: ${f.expectedValue}`
      );
      revisionDirectives.push(`STYLING FIDELITY REVISIONS:\n${fidelityNotes.join('\n')}`);
    }

    const preservation = plan?.preservationConstraints ? [...plan.preservationConstraints] : [];
    if (contextProps.length > 0 && !preservation.some(p => p.includes('Bảo toàn các đạo cụ bối cảnh đã phê duyệt'))) {
      preservation.push('Bảo toàn các đạo cụ bối cảnh đã phê duyệt');
    }

    if (preservation.length > 0) {
      revisionDirectives.push(`LOCKED PRESERVATION CONSTRAINTS (DO NOT ALTER):\n${preservation.join('\n')}`);
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
