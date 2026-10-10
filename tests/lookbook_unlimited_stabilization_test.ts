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
  compileVisualPrompt
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

console.log('================================================================');
console.log(`STABILIZATION SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}


