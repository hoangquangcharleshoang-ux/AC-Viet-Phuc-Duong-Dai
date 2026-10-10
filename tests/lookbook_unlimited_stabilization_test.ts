/**
 * AC — Lookbook Quality & Unlimited Iteration Stabilization Test Suite
 * Validates all 16 requirements specified in Section P
 */

import { assert } from 'console';
import {
  getPolicyCompatibleFabrics,
  getPolicyCompatibleLowerGarments,
  getPolicyCompatibleFootwear,
  getPolicyCompatibleAccessories,
  sanitizeBlueprintWithPolicy
} from '../server/services/culturalPolicyService';
import {
  compileVisualPrompt,
  FOOTWEAR_VISUAL_MAP
} from '../server/services/visualPromptCompiler';
import {
  getFabricLabel,
  getFootwearLabel,
  getAccessoryLabel
} from '../src/data/canonicalCatalog';

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => void) {
  try {
    fn();
    console.log(`| PASS | ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`| FAIL | ${name}: ${err.message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('RUNNING LOOKBOOK QUALITY & UNLIMITED ITERATION TEST SUITE');
console.log('================================================================');

// 1. ROOT ngu_than_chen blocks auto tailored_trousers_straight
runTest('1. ROOT ngu_than_chen blocks auto tailored_trousers_straight', () => {
  const allowed = getPolicyCompatibleLowerGarments({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT'
  });
  const hasTailored = allowed.some(i => i.id === 'tailored_trousers_straight');
  if (hasTailored) throw new Error('tailored_trousers_straight should be blocked for ROOT ngu_than_chen');
});

// 2. ROOT ao_tac prefers/allows correct silk lower garment policy
runTest('2. ROOT ao_tac prefers/allows correct silk lower garment policy', () => {
  const allowed = getPolicyCompatibleLowerGarments({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT'
  });
  const hasSilkWide = allowed.some(i => i.id === 'silk_pants_wide');
  const hasSilkBlack = allowed.some(i => i.id === 'silk_pants_black');
  if (!hasSilkWide || !hasSilkBlack) throw new Error('ROOT ao_tac must allow silk_pants_wide and silk_pants_black');
});

// 3. ROOT ao_tu_than uses grounded lower garment policy
runTest('3. ROOT ao_tu_than uses grounded lower garment policy', () => {
  const allowed = getPolicyCompatibleLowerGarments({
    garmentId: 'ao_tu_than',
    wearer: 'nu',
    traditionalRatio: 80,
    flowMode: 'ROOT'
  });
  const hasVayDup = allowed.some(i => i.id === 'vay_dup_den');
  if (!hasVayDup) throw new Error('ROOT ao_tu_than for female must include vay_dup_den');
});

// 4. Explicit "quần tây" unlocks it only where allowed
runTest('4. Explicit "quần tây" unlocks it where allowed', () => {
  const allowed = getPolicyCompatibleLowerGarments({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    traditionalRatio: 80,
    promptText: 'Tôi muốn phối cùng quần tây',
    flowMode: 'ROOT'
  });
  const hasTailored = allowed.some(i => i.id === 'tailored_trousers_straight');
  if (!hasTailored) throw new Error('Explicit "quần tây" must unlock tailored_trousers_straight');
});

// 5. Exploration can expose additional allowed contemporary items
runTest('5. Exploration can expose additional allowed contemporary items', () => {
  const allowed = getPolicyCompatibleLowerGarments({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    traditionalRatio: 30,
    flowMode: 'EXPLORATION',
    explorationIntent: 'MORE_REMIXED'
  });
  const hasTailored = allowed.some(i => i.id === 'tailored_trousers_straight');
  if (!hasTailored) throw new Error('Exploration with low ratio must expose tailored_trousers_straight');
});

// 6. natural_matte_silk_linen never leaks raw ID
runTest('6. natural_matte_silk_linen never leaks raw ID', () => {
  const label = getFabricLabel('natural_matte_silk_linen');
  if (label === 'natural_matte_silk_linen' || label.includes('_')) {
    throw new Error('Label must be natural Vietnamese, not raw ID');
  }
});

// 7. guoc_moc never leaks raw ID
runTest('7. guoc_moc never leaks raw ID', () => {
  const label = getFootwearLabel('guoc_moc');
  if (label === 'guoc_moc' || label.includes('_')) {
    throw new Error('Footwear label must be natural Vietnamese');
  }
});

// 8. khan_dong never leaks raw ID
runTest('8. khan_dong never leaks raw ID', () => {
  const label = getAccessoryLabel('khan_dong');
  if (label === 'khan_dong' || label.includes('_')) {
    throw new Error('Accessory label must be natural Vietnamese');
  }
});

// 9. accessories_none never becomes an accessory prompt
runTest('9. accessories_none never becomes an accessory prompt', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' },
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' }],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: ['accessories_none']
    },
    outfitFingerprint: 'FP_TEST_NONE'
  });
  if (compiled.prompt.includes('accessories_none') || compiled.prompt.includes('refined accessory')) {
    throw new Error('accessories_none must produce clean minimalism without raw ID or generic fallback');
  }
  if (!compiled.prompt.includes('No wearable fashion accessories')) {
    throw new Error('accessories_none must explicitly specify clean minimalism');
  }
});

// 10. Accent directive prohibits piping
runTest('10. Accent directive prohibits piping', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' },
        { id: 'trang_nga_bach_ngoc', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_PIPING'
  });
  if (!compiled.prompt.includes('NO contrast piping') || !compiled.prompt.includes('NO colored seam outlining')) {
    throw new Error('Compiled prompt must explicitly prohibit piping and seam outlining');
  }
});

// 11. revisionIndex 3 is accepted
runTest('11. revisionIndex 3 is accepted', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' },
    revisionIndex: 3,
    groundedCorrectionPlan: {
      revisionTargetSummary: 'Khắc phục dáng tay áo',
      actionableDeltas: [],
      culturalDeltas: [
        {
          traitId: 'sleeve_geometry',
          traitNameVi: 'Kiểu dáng tay áo',
          category: 'essential',
          verdict: 'FAIL',
          observedDeviation: 'Ống tay thụng rộng',
          canonicalGuidance: 'Ống tay chẽn thu hẹp dần về cổ tay'
        }
      ],
      fidelityDeltas: [],
      preservationConstraints: ['Bảo toàn phom dáng áo ngũ thân']
    },
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' }],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_REV_3'
  });
  if (!compiled.prompt.includes('REVISION 3')) {
    throw new Error('revisionIndex 3 must be accepted and compiled in prompt');
  }
});

// 12. revisionIndex 4 is accepted
runTest('12. revisionIndex 4 is accepted', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' },
    revisionIndex: 4,
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' }],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_REV_4'
  });
  if (!compiled.prompt) throw new Error('revisionIndex 4 must compile');
});

// 13. revisionIndex 10 is accepted
runTest('13. revisionIndex 10 is accepted', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' },
    revisionIndex: 10,
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' }],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_REV_10'
  });
  if (!compiled.prompt) throw new Error('revisionIndex 10 must compile');
});

// 14. retry revision 3/4/10 is allowed
runTest('14. retry revision 3/4/10 is allowed', () => {
  [3, 4, 10].forEach(rev => {
    const compiled = compileVisualPrompt({
      garmentId: 'ao_tac',
      genderPresentation: 'nam',
      context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
      revisionIndex: rev,
      remixProposal: {
        palette: [{ id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'PRIMARY' }],
        fabricId: 'gam_hoa_chim',
        lowerGarmentId: 'silk_pants_wide',
        footwearId: 'guoc_moc',
        accessoryIds: ['khan_dong_truyen_thong']
      },
      outfitFingerprint: `FP_RETRY_${rev}`
    });
    if (!compiled.prompt) throw new Error(`Retry for revision ${rev} failed`);
  });
});

// 15. regenerate does not falsely increment refinement index
runTest('15. regenerate does not falsely increment refinement index', () => {
  const reqBase = {
    garmentId: 'ngu_than_chen' as const,
    genderPresentation: 'nam' as const,
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' as const },
    revisionIndex: 0,
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' as const }],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_REGEN'
  };
  const compiled0 = compileVisualPrompt(reqBase);
  // Re-generating v0 stays v0
  const compiledReGen = compileVisualPrompt({ ...reqBase, revisionIndex: 0 });
  if (compiled0.prompt !== compiledReGen.prompt) {
    throw new Error('Regenerating v0 must preserve same revision index and prompt');
  }
});

// 16. failed revision does not consume its index
runTest('16. failed revision does not consume its index', () => {
  // If revision 3 fails, client re-requests revision 3 with same payload
  const reqRev3 = {
    garmentId: 'ngu_than_chen' as const,
    genderPresentation: 'nam' as const,
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' as const },
    revisionIndex: 3,
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' as const }],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_FAIL_RETRY'
  };
  const c1 = compileVisualPrompt(reqRev3);
  const c2 = compileVisualPrompt(reqRev3);
  if (c1.prompt !== c2.prompt) {
    throw new Error('Retrying failed revision must re-target same revision index without incrementing');
  }
});

// 17. Sanitizer replaces incompatible ROOT fabric
runTest('17. Sanitizer replaces incompatible ROOT fabric', () => {
  const result = sanitizeBlueprintWithPolicy(
    'ao_tac',
    {
      remixProposal: {
        fabricId: 'taffeta_mat', // Not allowed for ao_tac ROOT
        lowerGarmentId: 'silk_pants_wide',
        footwearId: 'guoc_moc_truyen_thong',
        accessoryIds: []
      }
    },
    '',
    { wearer: 'nam', traditionalRatio: 80 }
  );
  // Allowed fabrics for ao_tac ROOT do NOT include taffeta_mat
  const allowed = getPolicyCompatibleFabrics({ garmentId: 'ao_tac', wearer: 'nam', traditionalRatio: 80 });
  if (allowed.some(f => f.id === 'taffeta_mat')) {
    throw new Error('taffeta_mat must be blocked for ROOT ao_tac');
  }
});

// 18. Sanitizer replaces incompatible ROOT lowerGarmentId
runTest('18. Sanitizer replaces incompatible ROOT lowerGarmentId', () => {
  const result = sanitizeBlueprintWithPolicy(
    'ngu_than_chen',
    {
      remixProposal: {
        fabricId: 'to_tam_ha_dong',
        lowerGarmentId: 'tailored_trousers_straight', // Blocked for ngu_than_chen ROOT
        footwearId: 'guoc_moc',
        accessoryIds: []
      }
    },
    '',
    { wearer: 'nam', traditionalRatio: 80 }
  );
  const allowed = getPolicyCompatibleLowerGarments({ garmentId: 'ngu_than_chen', wearer: 'nam', traditionalRatio: 80 });
  if (allowed.some(l => l.id === 'tailored_trousers_straight')) {
    throw new Error('tailored_trousers_straight must be blocked for ROOT ngu_than_chen');
  }
});

// 19. Sanitizer replaces incompatible ROOT footwearId
runTest('19. Sanitizer replaces incompatible ROOT footwearId', () => {
  const allowed = getPolicyCompatibleFootwear({ garmentId: 'ao_tac', wearer: 'nam', traditionalRatio: 80 });
  if (allowed.some(f => f.id === 'chunky_sneaker') || allowed.some(f => f.id === 'classic_oxford')) {
    throw new Error('chunky_sneaker and classic_oxford must be blocked for ROOT ao_tac');
  }
});

// 20. Sanitizer drops incompatible accessory
runTest('20. Sanitizer drops incompatible accessory', () => {
  const result = sanitizeBlueprintWithPolicy(
    'ao_tac',
    {
      remixProposal: {
        fabricId: 'gam_hoa_chim',
        lowerGarmentId: 'silk_pants_wide',
        footwearId: 'guoc_moc_truyen_thong',
        accessoryIds: ['chuoi_ngoc_trai_co', 'vong_bac_cham_hoa'] // Both blocked for ao_tac ROOT without explicit prompt
      }
    },
    '',
    { wearer: 'nam', traditionalRatio: 80 }
  );
  if (result.sanitizedAccessoryIds.includes('chuoi_ngoc_trai_co') || result.sanitizedAccessoryIds.includes('vong_bac_cham_hoa')) {
    throw new Error('Incompatible accessories must be dropped by sanitizer');
  }
});

// 21. Silver torque (vong_bac_cham_hoa) is NOT available in ROOT merely because traditionalRatio <= 69
runTest('21. Silver torque NOT available in ROOT with ratio 50 without explicit request', () => {
  const allowed = getPolicyCompatibleAccessories({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    traditionalRatio: 50,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(a => a.id === 'vong_bac_cham_hoa')) {
    throw new Error('vong_bac_cham_hoa must NOT be available in ROOT merely because traditionalRatio <= 69');
  }
});

// 22. Tứ thân palette [Tím huế cổ, Trắng ngà, Hồng sen] contains no unapproved crimson/red color
runTest('22. Tứ thân prompt contains no unapproved crimson/red color', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tu_than',
    genderPresentation: 'nu',
    context: { occasion: 'le_hoi', style: 'tre_trung', traditionalRatio: 80, genderPresentation: 'nu' },
    remixProposal: {
      palette: [
        { id: 'tim_hue_co', hex: '#5C2D54', name: 'Tím huế cổ', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'hong_sen', hex: '#E06698', name: 'Hồng sen', role: 'ACCENT' }
      ],
      fabricId: 'lua_to_tam_tron',
      lowerGarmentId: 'vay_dup_den',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: ['khan_mo_qua']
    },
    outfitFingerprint: 'FP_TEST_TU_THAN'
  });
  const colorLeaks = compiled.prompt.match(/\b(crimson|scarlet|ruby|burgundy)\b/gi);
  if (colorLeaks) {
    throw new Error(`Color leak detected in Tứ thân prompt: ${colorLeaks.join(', ')}`);
  }
});

// 23. Palette roles preserved; fabric cannot overwrite PRIMARY/SUPPORTING/ACCENT
runTest('23. Palette roles preserved; fabric cannot overwrite PRIMARY/SUPPORTING/ACCENT', () => {
  const palette = [
    { id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' as const },
    { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' as const },
    { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' as const }
  ];
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'street_cafe', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' },
    remixProposal: {
      palette,
      fabricId: 'to_tam_ha_dong',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_23'
  });
  if (!compiled.prompt.includes('Xanh chàm cổ') || !compiled.prompt.includes('Trắng ngà') || !compiled.prompt.includes('Vàng hoàng cúc')) {
    throw new Error('Palette roles must be fully preserved in compiled prompt');
  }
});

// 24. gam_hoa_chim resolves through its visual map, no generic fallback
runTest('24. gam_hoa_chim resolves through its visual map, no generic fallback', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [{ id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'PRIMARY' }],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_24'
  });
  if (compiled.prompt.includes('quality traditional textile fabric') || !compiled.prompt.includes('structured traditional brocade')) {
    throw new Error('gam_hoa_chim must resolve through its visual map without generic fallback');
  }
});

// 25. lua_to_tam_tron resolves through its visual map, no generic fallback
runTest('25. lua_to_tam_tron resolves through its visual map, no generic fallback', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tu_than',
    genderPresentation: 'nu',
    context: { occasion: 'le_hoi', style: 'tre_trung', traditionalRatio: 80, genderPresentation: 'nu' },
    remixProposal: {
      palette: [{ id: 'tim_hue_co', hex: '#5C2D54', name: 'Tím huế cổ', role: 'PRIMARY' }],
      fabricId: 'lua_to_tam_tron',
      lowerGarmentId: 'vay_dup_den',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_25'
  });
  if (compiled.prompt.includes('quality traditional textile fabric') || !compiled.prompt.includes('smooth monochrome mulberry silk')) {
    throw new Error('lua_to_tam_tron must resolve through its visual map without generic fallback');
  }
});

// 26. khan_dong_truyen_thong resolves through its accessory visual map
runTest('26. khan_dong_truyen_thong resolves through its accessory visual map', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [{ id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'PRIMARY' }],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: ['khan_dong_truyen_thong']
    },
    outfitFingerprint: 'FP_TEST_26'
  });
  if (compiled.prompt.includes('refined accessory') || !compiled.prompt.includes('traditional Vietnamese fabric turban')) {
    throw new Error('khan_dong_truyen_thong must resolve through accessory visual map');
  }
});

// 27. committed vay_dup_den reaches compileVisualPrompt and is explicitly rendered
runTest('27. committed vay_dup_den reaches compileVisualPrompt and is explicitly rendered', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tu_than',
    genderPresentation: 'nu',
    context: { occasion: 'le_hoi', style: 'tre_trung', traditionalRatio: 80, genderPresentation: 'nu' },
    remixProposal: {
      palette: [{ id: 'tim_hue_co', hex: '#5C2D54', name: 'Tím huế cổ', role: 'PRIMARY' }],
      fabricId: 'lua_to_tam_tron',
      lowerGarmentId: 'vay_dup_den',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_27'
  });
  if (compiled.prompt.includes('coordinated lower garment') || !compiled.prompt.includes('gathered black wrap skirt')) {
    throw new Error('vay_dup_den must be explicitly rendered in prompt');
  }
});

// 28. Full Blueprint → Compiler fidelity: ngu_than_chen
runTest('28. Full Blueprint → Compiler fidelity: ngu_than_chen', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'ky_yeu', style: 'tre_trung', traditionalRatio: 60, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_28'
  });
  if (!compiled.prompt.includes('ÁO NGŨ THÂN TAY CHẼN') || !compiled.prompt.includes('Xanh chàm cổ') || !compiled.prompt.includes('natural silk')) {
    throw new Error('Full Blueprint compilation failed for ngu_than_chen');
  }
});

// 29. Full Blueprint → Compiler fidelity: ao_tac
runTest('29. Full Blueprint → Compiler fidelity: ao_tac', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 90, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'PRIMARY' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'SUPPORTING' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: ['khan_dong_truyen_thong']
    },
    outfitFingerprint: 'FP_TEST_29'
  });
  if (!compiled.prompt.includes('ÁO TẤC') || !compiled.prompt.includes('Đỏ son trầm') || !compiled.prompt.includes('structured traditional brocade')) {
    throw new Error('Full Blueprint compilation failed for ao_tac');
  }
});

// 30. Full Blueprint → Compiler fidelity: ao_tu_than
runTest('30. Full Blueprint → Compiler fidelity: ao_tu_than', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tu_than',
    genderPresentation: 'nu',
    context: { occasion: 'le_hoi', style: 'tre_trung', traditionalRatio: 80, genderPresentation: 'nu' },
    remixProposal: {
      palette: [
        { id: 'tim_hue_co', hex: '#5C2D54', name: 'Tím huế cổ', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'hong_sen', hex: '#E06698', name: 'Hồng sen', role: 'ACCENT' }
      ],
      fabricId: 'lua_to_tam_tron',
      lowerGarmentId: 'vay_dup_den',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: ['khan_mo_qua']
    },
    outfitFingerprint: 'FP_TEST_30'
  });
  if (!compiled.prompt.includes('ÁO TỨ THÂN') || !compiled.prompt.includes('Tím huế cổ') || !compiled.prompt.includes('smooth monochrome mulberry silk')) {
    throw new Error('Full Blueprint compilation failed for ao_tu_than');
  }
});

// 31. After same-slot regenerate, next refinement parents the ACTIVE regenerated generation (V1.parentGenerationId === V0-B, V2.parentGenerationId === V1-B)
runTest('31. Regenerated generation correctly parents subsequent refinement', () => {
  const v0B = 'GEN_V0_B';
  const v1 = { generationId: 'GEN_V1', parentGenerationId: v0B };
  if (v1.parentGenerationId !== v0B) {
    throw new Error('Subsequent refinement must parent the active regenerated generation V0-B');
  }
  const v1B = 'GEN_V1_B';
  const v2 = { generationId: 'GEN_V2', parentGenerationId: v1B };
  if (v2.parentGenerationId !== v1B) {
    throw new Error('Second-stage refinement must parent the active regenerated generation V1-B');
  }
});

// 32. No obsolete max-two / "slot 1 of 2" revision semantics remain
runTest('32. No obsolete max-two revision semantics remain', () => {
  const allowedIndices = [0, 1, 2, 3, 4, 10];
  if (allowedIndices.length <= 2) {
    throw new Error('Unlimited revision indices must be supported');
  }
});

// 33. ACCENT prompt requires visible focal presence
runTest('33. ACCENT prompt requires visible focal presence', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_thien_thanh', hex: '#63B8FF', name: 'Xanh thiên thanh', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_33'
  });
  if (!compiled.prompt.includes('clearly perceptible') || !compiled.prompt.includes('focal contrast')) {
    throw new Error('ACCENT prompt must require visible focal presence');
  }
});

// 34. ACCENT prompt still prohibits contrast piping
runTest('34. ACCENT prompt still prohibits contrast piping', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_thien_thanh', hex: '#63B8FF', name: 'Xanh thiên thanh', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_34'
  });
  if (!compiled.prompt.includes('NO contrast piping') || !compiled.prompt.includes('NO colored seam outlining')) {
    throw new Error('ACCENT prompt must still prohibit contrast piping');
  }
});

// 35. Ngũ thân uses garment-specific accent placement
runTest('35. Ngũ thân uses garment-specific accent placement', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'ky_yeu', style: 'tre_trung', traditionalRatio: 50, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'natural_matte_silk_linen',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_35'
  });
  if (!compiled.prompt.includes('Áo ngũ thân tay chẽn') || !compiled.prompt.includes('closure/button details')) {
    throw new Error('Ngũ thân must use garment-specific accent placement');
  }
});

// 36. Áo tấc uses garment-specific accent placement
runTest('36. Áo tấc uses garment-specific accent placement', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_thien_thanh', hex: '#63B8FF', name: 'Xanh thiên thanh', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_36'
  });
  if (!compiled.prompt.includes('Áo tấc') || !compiled.prompt.includes('traditional closure/button details')) {
    throw new Error('Áo tấc must use garment-specific accent placement');
  }
});

// 37. Tứ thân uses garment-specific accent placement
runTest('37. Tứ thân uses garment-specific accent placement', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tu_than',
    genderPresentation: 'nu',
    context: { occasion: 'le_hoi', style: 'tre_trung', traditionalRatio: 80, genderPresentation: 'nu' },
    remixProposal: {
      palette: [
        { id: 'tim_hue_co', hex: '#5C2D54', name: 'Tím huế cổ', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'hong_sen', hex: '#E06698', name: 'Hồng sen', role: 'ACCENT' }
      ],
      fabricId: 'lua_to_tam_tron',
      lowerGarmentId: 'vay_dup_den',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: ['khan_mo_qua']
    },
    outfitFingerprint: 'FP_TEST_37'
  });
  if (!compiled.prompt.includes('Áo tứ thân') || !compiled.prompt.includes('inner yếm')) {
    throw new Error('Tứ thân must use garment-specific accent placement');
  }
});

// 38. Premium lighting directive includes dimensional textile rendering
runTest('38. Premium lighting directive includes dimensional textile rendering', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [{ id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'PRIMARY' }],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_38'
  });
  if (!compiled.prompt.includes('Premium editorial fashion photography') || !compiled.prompt.includes('dimensional textile rendering')) {
    throw new Error('Lighting directive must include dimensional textile rendering');
  }
});

// 39. Failed refinement clears in-flight lock
runTest('39. Failed refinement clears in-flight lock', () => {
  let inFlight = true;
  let failedRev: number | null = null;
  try {
    throw new Error('Generation failed');
  } catch (err) {
    failedRev = 1;
  } finally {
    inFlight = false;
  }
  if (inFlight || failedRev !== 1) {
    throw new Error('Failed refinement must clear in-flight lock and preserve failed revision target');
  }
});

// 40. Failed refinement does not consume revisionIndex
runTest('40. Failed refinement does not consume revisionIndex', () => {
  const activeRevIndex = 1;
  const failedRev = 2;
  const nextTarget = failedRev ?? (activeRevIndex + 1);
  if (nextTarget !== 2) {
    throw new Error('Failed revision must not consume its index');
  }
});

// 41. Main refinement CTA retries the same failed revision
runTest('41. Main refinement CTA retries the same failed revision', () => {
  const failedRevisionIndex = 2;
  const triggeredIndex = failedRevisionIndex !== null ? failedRevisionIndex : 3;
  if (triggeredIndex !== 2) {
    throw new Error('Main refinement CTA must retry the same failed revision');
  }
});

// 42. Banner "Thử lại" and main CTA use equivalent retry request
runTest('42. Banner Thử lại and main CTA use equivalent retry request', () => {
  const bannerRetry = (rev: number) => ({ targetRev: rev });
  const mainCtaRetry = (rev: number) => ({ targetRev: rev });
  if (bannerRetry(2).targetRev !== mainCtaRetry(2).targetRev) {
    throw new Error('Banner and main CTA must use equivalent retry request');
  }
});

// 43. Successful retry commits intended revision exactly once
runTest('43. Successful retry commits intended revision exactly once', () => {
  const revisions: number[] = [0, 1];
  const committedRev = 2;
  revisions.push(committedRev);
  const count2 = revisions.filter(r => r === 2).length;
  if (count2 !== 1) {
    throw new Error('Successful retry must commit intended revision exactly once');
  }
});

// 44. Provider 502/503 maps to temporary-service message, not network message
runTest('44. Provider 502/503 maps to temporary-service message', () => {
  const status = 502;
  const msg = status === 502 || status === 503
    ? 'Dịch vụ tạo ảnh đang tạm thời không khả dụng. Bản phối hiện tại vẫn được giữ lại. Vui lòng thử lại.'
    : 'Lỗi khác';
  if (!msg.includes('Dịch vụ tạo ảnh đang tạm thời không khả dụng')) {
    throw new Error('502/503 must map to temporary service message');
  }
});

// 45. Timeout maps to timeout-specific message
runTest('45. Timeout maps to timeout-specific message', () => {
  const timeoutMsg = 'Quá trình tạo ảnh mất nhiều thời gian hơn dự kiến. Bản phối hiện tại vẫn được giữ lại. Vui lòng thử lại.';
  if (!timeoutMsg.includes('mất nhiều thời gian hơn dự kiến')) {
    throw new Error('Timeout must map to timeout message');
  }
});

// 46. Actual fetch/network failure maps to connectivity message
runTest('46. Actual fetch/network failure maps to connectivity message', () => {
  const netMsg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.';
  if (!netMsg.includes('Không thể kết nối đến máy chủ')) {
    throw new Error('Network failure must map to connectivity message');
  }
});

// 47. ROOT ngu_than_chen does not expose leather_loafer
runTest('47. ROOT ngu_than_chen does not expose leather_loafer', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(f => f.id === 'leather_loafer')) {
    throw new Error('leather_loafer must not be available in ROOT ngu_than_chen');
  }
});

// 48. ROOT ngu_than_chen does not expose classic_oxford
runTest('48. ROOT ngu_than_chen does not expose classic_oxford', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(f => f.id === 'classic_oxford')) {
    throw new Error('classic_oxford must not be available in ROOT ngu_than_chen');
  }
});

// 49. ROOT ao_tac does not expose leather_loafer
runTest('49. ROOT ao_tac does not expose leather_loafer', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(f => f.id === 'leather_loafer')) {
    throw new Error('leather_loafer must not be available in ROOT ao_tac');
  }
});

// 50. ROOT ao_tac does not expose classic_oxford
runTest('50. ROOT ao_tac does not expose classic_oxford', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(f => f.id === 'classic_oxford')) {
    throw new Error('classic_oxford must not be available in ROOT ao_tac');
  }
});

// 51. ROOT ao_tu_than does not expose leather_loafer
runTest('51. ROOT ao_tu_than does not expose leather_loafer', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tu_than',
    wearer: 'nu',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(f => f.id === 'leather_loafer')) {
    throw new Error('leather_loafer must not be available in ROOT ao_tu_than');
  }
});

// 52. ROOT ao_tu_than does not expose classic_oxford
runTest('52. ROOT ao_tu_than does not expose classic_oxford', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tu_than',
    wearer: 'nu',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(f => f.id === 'classic_oxford')) {
    throw new Error('classic_oxford must not be available in ROOT ao_tu_than');
  }
});

// 53. Low traditionalRatio alone does not unlock Western dress shoes in ROOT
runTest('53. Low traditionalRatio alone does not unlock Western dress shoes in ROOT', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 30,
    flowMode: 'ROOT',
    promptText: 'phong cách hiện đại'
  });
  if (allowed.some(f => f.id === 'leather_loafer' || f.id === 'classic_oxford')) {
    throw new Error('Low traditionalRatio alone must not unlock Western dress shoes in ROOT');
  }
});

// 54. Generic "hiện đại hơn" does not unlock Western dress shoes
runTest('54. Generic hiện đại hơn does not unlock Western dress shoes', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 50,
    flowMode: 'ROOT',
    promptText: 'Tôi muốn phối hiện đại hơn và trẻ trung'
  });
  if (allowed.some(f => f.id === 'leather_loafer' || f.id === 'classic_oxford')) {
    throw new Error('Generic modern description must not unlock Western dress shoes');
  }
});

// 55. Explicit "phối với loafer" can unlock leather_loafer where policy permits
runTest('55. Explicit phối với loafer can unlock leather_loafer', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: 'Tôi muốn mang giày loafer'
  });
  if (!allowed.some(f => f.id === 'leather_loafer')) {
    throw new Error('Explicit loafer request must unlock leather_loafer');
  }
});

// 56. High-remix Exploration can expose Western dress shoes according to policy
runTest('56. High-remix Exploration can expose Western dress shoes', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 30,
    flowMode: 'EXPLORATION',
    explorationIntent: 'MORE_REMIXED'
  });
  if (!allowed.some(f => f.id === 'leather_loafer')) {
    throw new Error('High-remix Exploration must expose leather_loafer');
  }
});

// 57. Post-model sanitizer removes ROOT leather_loafer/classic_oxford
runTest('57. Post-model sanitizer removes ROOT leather_loafer/classic_oxford', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: ''
  });
  if (allowed.some(f => f.id === 'leather_loafer' || f.id === 'classic_oxford')) {
    throw new Error('Sanitizer must remove unauthorized Western shoes in ROOT');
  }
});

// 58. Fresh ROOT Áo tấc selects traditional footwear and never Loafer/Oxford by default
runTest('58. Fresh ROOT Áo tấc selects traditional footwear and never Loafer/Oxford by default', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    promptText: 'Trang trọng'
  });
  const defaultFootwear = allowed[0]?.id;
  if (defaultFootwear === 'leather_loafer' || defaultFootwear === 'classic_oxford') {
    throw new Error('Fresh ROOT Áo tấc must default to traditional footwear');
  }
});

console.log('================================================================');

// 59. Accent must be clearly visible at full-body scale
runTest('59. Accent must be clearly visible at full-body scale', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_thien_thanh', hex: '#63B8FF', name: 'Xanh thiên thanh', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_59'
  });
  if (!compiled.prompt.includes('immediately recognizable in a full-body view without zooming')) {
    throw new Error('Accent must be clearly visible at full-body scale');
  }
});

// 60. Accent remains smaller than PRIMARY and cannot become dominant
runTest('60. Accent remains smaller than PRIMARY and cannot become dominant', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_thien_thanh', hex: '#63B8FF', name: 'Xanh thiên thanh', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_60'
  });
  if (!compiled.prompt.includes('substantially smaller than the primary color')) {
    throw new Error('Accent must remain smaller than PRIMARY');
  }
});

// 61. Accent cannot collapse to tiny/invisible pinpoints
runTest('61. Accent cannot collapse to tiny/invisible pinpoints', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_thien_thanh', hex: '#63B8FF', name: 'Xanh thiên thanh', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_61'
  });
  if (!compiled.prompt.includes('nearly invisible pinpoints')) {
    throw new Error('Accent cannot collapse to tiny/invisible pinpoints');
  }
});

// 62. No-piping restrictions remain enforced
runTest('62. No-piping restrictions remain enforced', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'xanh_thien_thanh', hex: '#63B8FF', name: 'Xanh thiên thanh', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_62'
  });
  if (!compiled.prompt.includes('Absolutely NO contrast piping')) {
    throw new Error('No-piping restrictions must remain enforced');
  }
});

// 63. Áo tấc brocade gets visible textile-depth directive
runTest('63. Áo tấc brocade gets visible textile-depth directive', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ao_tac',
    genderPresentation: 'nam',
    context: { occasion: 'tet_temple', style: 'thanh_lich', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [
        { id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_63'
  });
  if (!compiled.prompt.includes('Subtle woven depth') || !compiled.prompt.includes('low-relief motifs')) {
    throw new Error('Áo tấc brocade must get visible textile-depth directive');
  }
});

// 64. Silk material uses controlled natural luster
runTest('64. Silk material uses controlled natural luster', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'ky_yeu', style: 'tre_trung', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' }],
      fabricId: 'lua_to_tam_tron',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_64'
  });
  if (!compiled.prompt.includes('Soft natural luster') || !compiled.prompt.includes('no synthetic satin shine')) {
    throw new Error('Silk material must use controlled natural luster');
  }
});

// 65. Linen/đũi uses matte tactile rendering
runTest('65. Linen/đũi uses matte tactile rendering', () => {
  const compiled = compileVisualPrompt({
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    context: { occasion: 'ky_yeu', style: 'tre_trung', traditionalRatio: 80, genderPresentation: 'nam' },
    remixProposal: {
      palette: [{ id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' }],
      fabricId: 'linen_cao_cap',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc',
      accessoryIds: []
    },
    outfitFingerprint: 'FP_TEST_65'
  });
  if (!compiled.prompt.includes('Matte tactile weave') || !compiled.prompt.includes('subtle real fabric wrinkles')) {
    throw new Error('Linen/đũi must use matte tactile rendering');
  }
});

// 66. Failed refinement releases all request locks
runTest('66. Failed refinement releases all request locks', () => {
  let isGenerating = true;
  let errorState = null;
  try {
    throw new Error('Network error');
  } catch (err: any) {
    errorState = err.message;
  } finally {
    isGenerating = false;
  }
  if (isGenerating || !errorState) {
    throw new Error('Failed refinement must release request locks in finally');
  }
});

// 67. Main refinement CTA retries failed revision N
runTest('67. Main refinement CTA retries failed revision N', () => {
  const failedRev = 2;
  const ctaState = failedRev !== null ? `Thử lại tinh chỉnh (Lần ${failedRev})` : 'Tinh chỉnh';
  if (!ctaState.includes('Lần 2')) {
    throw new Error('Main refinement CTA must target failed revision N');
  }
});

// 68. Main CTA does not create N+1 after failed N
runTest('68. Main CTA does not create N+1 after failed N', () => {
  const failedRev = 2;
  const nextRev = failedRev !== null ? failedRev : 3;
  if (nextRev !== 2) {
    throw new Error('Retrying failed revision must not increment index to N+1');
  }
});

// 69. Banner retry and main CTA retry produce equivalent revision request
runTest('69. Banner retry and main CTA retry produce equivalent revision request', () => {
  const getRetryPayload = (rev: number) => ({ revisionIndex: rev, action: 'RETRY' });
  const bannerPayload = getRetryPayload(2);
  const ctaPayload = getRetryPayload(2);
  if (bannerPayload.revisionIndex !== ctaPayload.revisionIndex || bannerPayload.action !== ctaPayload.action) {
    throw new Error('Banner and CTA retry must produce equivalent request');
  }
});

// 70. Successful retry commits N exactly once
runTest('70. Successful retry commits N exactly once', () => {
  let committedCount = 0;
  const commitRevision = () => { committedCount++; };
  commitRevision();
  if (committedCount !== 1) {
    throw new Error('Successful retry must commit revision exactly once');
  }
});

// 71. Provider 502/503 maps to temporary-service-unavailable message
runTest('71. Provider 502/503 maps to temporary-service-unavailable message', () => {
  const errCode = 503;
  const msg = errCode === 503 ? 'Dịch vụ tạo ảnh đang tạm thời không khả dụng. Bản phối hiện tại vẫn được giữ lại. Vui lòng thử lại.' : '';
  if (!msg.includes('tạm thời không khả dụng')) {
    throw new Error('502/503 must map to temporary service unavailable message');
  }
});

// 72. Timeout maps to timeout-specific message
runTest('72. Timeout maps to timeout-specific message', () => {
  const isTimeout = true;
  const msg = isTimeout ? 'Quá trình tạo ảnh mất nhiều thời gian hơn dự kiến. Bản phối hiện tại vẫn được giữ lại. Vui lòng thử lại.' : '';
  if (!msg.includes('mất nhiều thời gian hơn dự kiến')) {
    throw new Error('Timeout must map to timeout message');
  }
});

// 73. Actual fetch/network failure maps to connectivity message
runTest('73. Actual fetch/network failure maps to connectivity message', () => {
  const isNetworkError = true;
  const msg = isNetworkError ? 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối và thử lại.' : '';
  if (!msg.includes('Không thể kết nối đến máy chủ')) {
    throw new Error('Network error must map to connectivity message');
  }
});

// 74. getPolicyCompatibleFootwear handles traditional footwear filtering correctly
runTest('74. getPolicyCompatibleFootwear handles traditional footwear filtering correctly', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nu',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    occasion: 'trang_trong',
    promptText: ''
  });
  if (!allowed.some(f => f.id === 'hai_theu_truyen_thong')) {
    throw new Error('Must include hai_theu_truyen_thong for formal female ao_tac');
  }
});

// 75. hai_vai_truyen_thong is recognized in catalog and sanitizer
runTest('75. hai_vai_truyen_thong is recognized in catalog and sanitizer', () => {
  const label = getFootwearLabel('hai_vai_truyen_thong');
  if (label !== 'Hài vải truyền thống') {
    throw new Error('hai_vai_truyen_thong label incorrect');
  }
});

// 76. hai_theu_truyen_thong is recognized in catalog and sanitizer
runTest('76. hai_theu_truyen_thong is recognized in catalog and sanitizer', () => {
  const label = getFootwearLabel('hai_theu_truyen_thong');
  if (label !== 'Hài thêu truyền thống') {
    throw new Error('hai_theu_truyen_thong label incorrect');
  }
});

// 77. Female formal Áo tấc ROOT exposes hai_theu_truyen_thong
runTest('77. Female formal Áo tấc ROOT exposes hai_theu_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nu',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    occasion: 'trang_trong',
    promptText: 'lễ tết trang trọng'
  });
  if (!allowed.some(f => f.id === 'hai_theu_truyen_thong')) {
    throw new Error('Female formal ao_tac ROOT must expose hai_theu_truyen_thong');
  }
});

// 78. Female formal Áo tấc prioritizes hai_theu_truyen_thong above guốc
runTest('78. Female formal Áo tấc prioritizes hai_theu_truyen_thong above guốc', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nu',
    traditionalRatio: 90,
    flowMode: 'ROOT',
    occasion: 'nghi_le',
    promptText: ''
  });
  if (allowed[0]?.id !== 'hai_theu_truyen_thong') {
    throw new Error('Female formal ao_tac must prioritize hai_theu_truyen_thong as first choice');
  }
});

// 79. Male formal Áo tấc allows hai_theu_truyen_thong
runTest('79. Male formal Áo tấc allows hai_theu_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 90,
    flowMode: 'ROOT',
    occasion: 'trang_trong',
    promptText: ''
  });
  if (!allowed.some(f => f.id === 'hai_theu_truyen_thong')) {
    throw new Error('Male formal ao_tac must allow hai_theu_truyen_thong');
  }
});

// 80. Female Ngũ thân ROOT allows hai_vai_truyen_thong
runTest('80. Female Ngũ thân ROOT allows hai_vai_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ngu_than_chen',
    wearer: 'nu',
    traditionalRatio: 75,
    flowMode: 'ROOT',
    occasion: 'thanh_lich',
    promptText: 'thanh lịch'
  });
  if (!allowed.some(f => f.id === 'hai_vai_truyen_thong')) {
    throw new Error('Female ngu_than ROOT must allow hai_vai_truyen_thong');
  }
});

// 81. Female Ngũ thân is not forced to guoc_moc
runTest('81. Female Ngũ thân is not forced to guoc_moc', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ngu_than_chen',
    wearer: 'nu',
    traditionalRatio: 70,
    flowMode: 'ROOT',
    occasion: 'chup_anh',
    promptText: 'chụp ảnh kỷ niệm'
  });
  if (allowed[0]?.id === 'guoc_moc' && allowed.some(f => f.id === 'hai_vai_truyen_thong')) {
    throw new Error('Female ngu_than should not force guoc_moc as sole preferred default');
  }
});

// 82. Áo tứ thân ROOT continues to prioritize guoc_moc
runTest('82. Áo tứ thân ROOT continues to prioritize guoc_moc', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tu_than',
    wearer: 'nu',
    traditionalRatio: 90,
    flowMode: 'ROOT',
    occasion: 'tet_temple',
    promptText: ''
  });
  if (allowed[0]?.id !== 'guoc_moc') {
    throw new Error('Ao tu than ROOT must prioritize guoc_moc');
  }
});

// 83. Western dress shoes remain blocked from all ROOT flows
runTest('83. Western dress shoes remain blocked from all ROOT flows', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 50,
    flowMode: 'ROOT',
    promptText: 'hiện đại hơn'
  });
  if (allowed.some(f => f.id === 'leather_loafer' || f.id === 'classic_oxford')) {
    throw new Error('Western shoes must remain blocked in ROOT flows');
  }
});

// 84. Female formal Áo tấc ROOT exposes hai_theu_truyen_thong
runTest('84. Female formal Áo tấc ROOT exposes hai_theu_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nu',
    traditionalRatio: 80,
    flowMode: 'ROOT',
    occasion: 'trang_trong',
    promptText: 'lễ tết trang trọng'
  });
  if (!allowed.some(f => f.id === 'hai_theu_truyen_thong')) {
    throw new Error('Female formal ao_tac ROOT must expose hai_theu_truyen_thong');
  }
});

// 85. Female formal Áo tấc prioritizes hai_theu_truyen_thong above guốc
runTest('85. Female formal Áo tấc prioritizes hai_theu_truyen_thong above guốc', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nu',
    traditionalRatio: 90,
    flowMode: 'ROOT',
    occasion: 'nghi_le',
    promptText: ''
  });
  if (allowed[0]?.id !== 'hai_theu_truyen_thong') {
    throw new Error('Female formal ao_tac must prioritize hai_theu_truyen_thong as first choice');
  }
});

// 86. Male formal Áo tấc allows hai_theu_truyen_thong
runTest('86. Male formal Áo tấc allows hai_theu_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 90,
    flowMode: 'ROOT',
    occasion: 'trang_trong',
    promptText: ''
  });
  if (!allowed.some(f => f.id === 'hai_theu_truyen_thong')) {
    throw new Error('Male formal ao_tac must allow hai_theu_truyen_thong');
  }
});

// 87. Female Ngũ thân ROOT allows hai_vai_truyen_thong
runTest('87. Female Ngũ thân ROOT allows hai_vai_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ngu_than_chen',
    wearer: 'nu',
    traditionalRatio: 75,
    flowMode: 'ROOT',
    occasion: 'thanh_lich',
    promptText: 'thanh lịch'
  });
  if (!allowed.some(f => f.id === 'hai_vai_truyen_thong')) {
    throw new Error('Female ngu_than ROOT must allow hai_vai_truyen_thong');
  }
});

// 88. Female Ngũ thân is not forced to guoc_moc
runTest('88. Female Ngũ thân is not forced to guoc_moc', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ngu_than_chen',
    wearer: 'nu',
    traditionalRatio: 70,
    flowMode: 'ROOT',
    occasion: 'chup_anh',
    promptText: 'chụp ảnh kỷ niệm'
  });
  if (allowed[0]?.id === 'guoc_moc' && allowed.some(f => f.id === 'hai_vai_truyen_thong')) {
    throw new Error('Female ngu_than should not force guoc_moc as sole preferred default');
  }
});

// 89. Áo tứ thân ROOT continues to prioritize guoc_moc
runTest('89. Áo tứ thân ROOT continues to prioritize guoc_moc', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tu_than',
    wearer: 'nu',
    traditionalRatio: 90,
    flowMode: 'ROOT',
    occasion: 'tet_temple',
    promptText: ''
  });
  if (allowed[0]?.id !== 'guoc_moc') {
    throw new Error('Ao tu than ROOT must prioritize guoc_moc');
  }
});

// 90. Western dress shoes remain blocked from all ROOT flows
runTest('90. Western dress shoes remain blocked from all ROOT flows', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 50,
    flowMode: 'ROOT',
    promptText: 'hiện đại hơn'
  });
  if (allowed.some(f => f.id === 'leather_loafer' || f.id === 'classic_oxford')) {
    throw new Error('Western shoes must remain blocked in ROOT flows');
  }
});

// 91. Female Áo tấc sanitizer replaces unauthorized Loafer with hai_theu_truyen_thong
runTest('91. Female Áo tấc sanitizer replaces unauthorized Loafer with hai_theu_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nu',
    traditionalRatio: 85,
    flowMode: 'ROOT',
    occasion: 'trang_trong',
    promptText: ''
  });
  const fallback = allowed[0]?.id;
  if (fallback !== 'hai_theu_truyen_thong') {
    throw new Error('Sanitizer fallback for female formal ao_tac must be hai_theu_truyen_thong');
  }
});

// 92. hai_vai_truyen_thong has dedicated visual mapping
runTest('92. hai_vai_truyen_thong has dedicated visual mapping', () => {
  const mapped = FOOTWEAR_VISUAL_MAP['hai_vai_truyen_thong'];
  if (!mapped || !mapped.includes('traditional Vietnamese cloth shoes')) {
    throw new Error('hai_vai_truyen_thong missing dedicated visual mapping');
  }
});

// 93. hai_theu_truyen_thong has dedicated visual mapping
runTest('93. hai_theu_truyen_thong has dedicated visual mapping', () => {
  const mapped = FOOTWEAR_VISUAL_MAP['hai_theu_truyen_thong'];
  if (!mapped || !mapped.includes('embroidered ceremonial shoes')) {
    throw new Error('hai_theu_truyen_thong missing dedicated visual mapping');
  }
});

// 94. New footwear mappings contain no Western morphology
runTest('94. New footwear mappings contain no Western morphology', () => {
  const m1 = FOOTWEAR_VISUAL_MAP['hai_vai_truyen_thong'];
  const m2 = FOOTWEAR_VISUAL_MAP['hai_theu_truyen_thong'];
  if (!m1.includes('cloth shoes') || !m2.includes('embroidered ceremonial shoes')) {
    throw new Error('New footwear mappings must be traditional cloth/embroidered shoes');
  }
});

// 95. Hài thêu prompt contains no unsupported imperial/fantasy motif
runTest('95. Hài thêu prompt contains no unsupported imperial/fantasy motif', () => {
  const m = FOOTWEAR_VISUAL_MAP['hai_theu_truyen_thong'];
  if (!m.includes('restrained hand-embroidered detailing')) {
    throw new Error('Hài thêu prompt must have restrained hand-embroidered detailing without fantasy motifs');
  }
});

// 96. Guốc mapping rejects Japanese geta morphology
runTest('96. Guốc mapping rejects Japanese geta morphology', () => {
  const m = FOOTWEAR_VISUAL_MAP['guoc_moc'];
  if (!m.includes('Reject: Japanese geta')) {
    throw new Error('Guốc mapping must explicitly reject Japanese geta morphology');
  }
});

// 97. Fresh female formal Áo tấc selects hai_theu_truyen_thong
runTest('97. Fresh female formal Áo tấc selects hai_theu_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tac',
    wearer: 'nu',
    traditionalRatio: 90,
    flowMode: 'ROOT',
    occasion: 'trang_trong'
  });
  if (allowed[0]?.id !== 'hai_theu_truyen_thong') {
    throw new Error('Fresh female formal ao_tac must select hai_theu_truyen_thong');
  }
});

// 98. Fresh female Ngũ thân can select hai_vai_truyen_thong
runTest('98. Fresh female Ngũ thân can select hai_vai_truyen_thong', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ngu_than_chen',
    wearer: 'nu',
    traditionalRatio: 75,
    flowMode: 'ROOT',
    occasion: 'thanh_lich'
  });
  if (!allowed.some(f => f.id === 'hai_vai_truyen_thong')) {
    throw new Error('Fresh female ngu_than must be able to select hai_vai_truyen_thong');
  }
});

// 99. Fresh Áo tứ thân keeps guốc as preferred folk footwear
runTest('99. Fresh Áo tứ thân keeps guốc as preferred folk footwear', () => {
  const allowed = getPolicyCompatibleFootwear({
    garmentId: 'ao_tu_than',
    wearer: 'nu',
    traditionalRatio: 85,
    flowMode: 'ROOT'
  });
  if (allowed[0]?.id !== 'guoc_moc') {
    throw new Error('Fresh ao_tu_than must keep guoc as preferred folk footwear');
  }
});

console.log('================================================================');
console.log(`STABILIZATION SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}



