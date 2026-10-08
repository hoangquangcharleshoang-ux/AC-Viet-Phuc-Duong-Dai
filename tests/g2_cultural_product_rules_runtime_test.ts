/**
 * AC — Cultural Product Rules v1.1 Runtime Integration Test Suite (G2)
 *
 * Verifies runtime implementation of Cultural Product Rules v1.1:
 * - Call A Wearer-Aware Recommendation
 * - Call B Context-Aware Accessory Selection & Sanitization
 * - Guided Exploration Accessory Policy
 * - Visual Prompt Compiler Guardrails
 *
 * MOCK MODE: Zero live Gemini or OpenAI calls
 */

import {
  validateAndEnforceRecommendationPolicy,
  getPolicyCompatibleAccessories,
  isMaleTuThanExplicitRemix,
  isFanRequestedExplicitly,
  isPearlRequestedExplicitly,
  sanitizeBlueprintWithPolicy
} from '../server/services/culturalPolicyService';
import { compileVisualPrompt } from '../server/services/visualPromptCompiler';
import { GarmentRecommendationOutput, GenerateLookbookRequest } from '../src/types/index';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
}

async function runTestSuite() {
  console.log('========================================================');
  console.log('RUNNING G2 CULTURAL PRODUCT RULES v1.1 RUNTIME TEST SUITE');
  console.log('MOCK MODE: ZERO LIVE GEMINI OR OPENAI CALLS');
  console.log('========================================================\n');

  // -------------------------------------------------------------------------
  // 1. CALL A: WEARER-AWARE RECOMMENDATION POLICY
  // -------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: CALL A WEARER-AWARE RECOMMENDATION ---');

  // Test 1.1: Male wearer + Áo tứ thân WITHOUT explicit remix -> Fallback away from male tứ thân
  const rawMaleTuThan: GarmentRecommendationOutput = {
    primary: {
      garmentId: 'ao_tu_than',
      rationale: 'Trang phục truyền thống 4 thân tạo vẻ đẹp hoài cổ.'
    },
    alternative: {
      garmentId: 'ngu_than_chen',
      rationale: 'Áo ngũ thân tay chẽn gọn gàng cho nam giới.'
    }
  };

  const enforced1_1 = validateAndEnforceRecommendationPolicy(rawMaleTuThan, {
    wearer: 'nam',
    occasion: 'street_cafe',
    promptText: 'Tôi muốn tìm trang phục truyền thống đi chụp ảnh kỷ niệm'
  });

  assert(
    enforced1_1.primary.garmentId !== 'ao_tu_than',
    'Male wearer without explicit remix must NOT receive ao_tu_than as primary recommendation'
  );
  assert(
    enforced1_1.primary.garmentId === 'ngu_than_chen',
    'Male wearer without explicit remix should fall back to valid alternative (ngu_than_chen)'
  );
  console.log('[PASS] 1.1 Male without remix redirected away from ao_tu_than default');

  // Test 1.2: Male wearer + Áo tứ thân WITH explicit remix intent -> Allowed with clear labeling
  const enforced1_2 = validateAndEnforceRecommendationPolicy(rawMaleTuThan, {
    wearer: 'nam',
    occasion: 'street_cafe',
    promptText: 'Thiết kế áo tứ thân cách tân cho nam giới trình diễn thời trang đương đại'
  });

  assert(
    enforced1_2.primary.garmentId === 'ao_tu_than',
    'Male wearer WITH explicit remix intent is permitted to explore contemporary ao_tu_than'
  );
  assert(
    enforced1_2.primary.rationale.includes('đương đại') || enforced1_2.primary.rationale.includes('cách tân'),
    'Rationale for male ao_tu_than MUST clearly label the outfit as contemporary reinterpretation / remix'
  );
  console.log('[PASS] 1.2 Male with explicit remix allows ao_tu_than with clearly labeled rationale');

  // Test 1.3: Female wearer + Áo tứ thân -> Auto-eligible
  const rawFemaleTuThan: GarmentRecommendationOutput = {
    primary: {
      garmentId: 'ao_tu_than',
      rationale: 'Trang phục truyền thống phụ nữ Bắc Bộ duyên dáng cho ngày hội hè.'
    },
    alternative: {
      garmentId: 'ao_tac',
      rationale: 'Lễ phục trang trọng cho ngày lễ.'
    }
  };

  const enforced1_3 = validateAndEnforceRecommendationPolicy(rawFemaleTuThan, {
    wearer: 'nu',
    occasion: 'cultural_wedding',
    promptText: 'Trang phục duyên dáng dự sự kiện văn hóa'
  });

  assert(
    enforced1_3.primary.garmentId === 'ao_tu_than',
    'Female wearer is historically documented and auto-eligible for ao_tu_than'
  );
  console.log('[PASS] 1.3 Female wearer auto-eligible for ao_tu_than');

  // Test 1.4: Neutral wearer + Áo tứ thân preserves documented female profile default
  const enforced1_4 = validateAndEnforceRecommendationPolicy(rawFemaleTuThan, {
    wearer: 'neutral',
    occasion: 'tet_temple',
    traditionalRatio: 80,
    promptText: 'Trang phục truyền thống du xuân'
  });
  assert(
    enforced1_4.primary.garmentId === 'ao_tu_than',
    'Neutral wearer with traditional ratio preserves documented female profile ground truth'
  );
  console.log('[PASS] 1.4 Neutral wearer grounds ao_tu_than in documented female profile');

  // Test 1.5: Áo tấc in casual street context -> Prefer ngũ thân tay chẽn if available
  const rawCasualAoTac: GarmentRecommendationOutput = {
    primary: {
      garmentId: 'ao_tac',
      rationale: 'Áo tấc trang nghiêm.'
    },
    alternative: {
      garmentId: 'ngu_than_chen',
      rationale: 'Áo ngũ thân tay chẽn gọn gàng cho sinh hoạt.'
    }
  };

  const enforced1_5 = validateAndEnforceRecommendationPolicy(rawCasualAoTac, {
    wearer: 'nam',
    occasion: 'street_cafe',
    traditionalRatio: 70,
    promptText: 'Dạo phố cà phê cuối tuần cùng bạn bè'
  });

  assert(
    enforced1_5.primary.garmentId === 'ngu_than_chen',
    'In casual street cafe context, ngu_than_chen is preferred over ceremonial ao_tac'
  );
  console.log('[PASS] 1.5 Casual street context prefers ngu_than_chen over ceremonial ao_tac');

  // -------------------------------------------------------------------------
  // 2. CALL B: CONTEXT-AWARE ACCESSORY SELECTION & SANITIZATION
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: CALL B CONTEXT-AWARE ACCESSORIES ---');

  // Test 2.1: Female wearer NEVER receives khan_dong_truyen_thong (no incorrect mapping)
  const femaleAccessories = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nu',
    occasion: 'tet_temple',
    traditionalRatio: 80
  });

  assert(
    !femaleAccessories.some(a => a.id === 'khan_dong_truyen_thong'),
    'Female wearer must NEVER be assigned male-oriented khan_dong_truyen_thong'
  );
  console.log('[PASS] 2.1 Female wearer does not receive male khăn đóng (prefers no headwear over misattribution)');

  // Test 2.2: Male wearer NEVER receives khan_mo_qua or non_thung_quai_thao
  const maleAccessories = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nam',
    occasion: 'tet_temple',
    traditionalRatio: 80
  });

  assert(
    !maleAccessories.some(a => a.id === 'khan_mo_qua' || a.id === 'non_thung_quai_thao'),
    'Male wearer must NEVER receive northern female folk headwear (khan mo qua / non quai thao)'
  );
  assert(
    maleAccessories.some(a => a.id === 'khan_dong_truyen_thong'),
    'Male wearer with ceremonial ao_tac is compatible with khan_dong_truyen_thong'
  );
  console.log('[PASS] 2.2 Male wearer receives only compatible male headwear, not female folk headwear');

  // -------------------------------------------------------------------------
  // TEST 1 (MANDATORY): Fan EXPLICIT_ONLY Negative Test
  // Input: ao_tac, nam, ceremonial/traditional context, traditionalRatio 80+, NO fan request
  // Expected:
  // - fan NOT in compatible accessory candidates
  // - sanitizer strips fan if returned by model
  // - final accessoryIds does not contain fan
  // -------------------------------------------------------------------------
  const test1Candidates = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nam',
    occasion: 'tet_temple',
    traditionalRatio: 85,
    promptText: 'Trang phục Áo tấc truyền thống trang nghiêm dự lễ cưới'
  });

  assert(
    !test1Candidates.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 1] Handheld fan must NOT be in compatible accessory candidates when user did not request it (traditionalRatio 85%)'
  );

  // Model returns fan anyway -> sanitizer must strip it
  const test1ModelOutput = {
    garmentId: 'ao_tac',
    remixProposal: {
      palette: [],
      fabricId: 'gam_hoa_chim',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'classic_oxford',
      accessoryIds: ['khan_dong_truyen_thong', 'quat_giay_tram_huong']
    },
    contextCautions: []
  };

  const test1Sanitized = sanitizeBlueprintWithPolicy(
    'ao_tac',
    test1ModelOutput,
    'Trang phục Áo tấc truyền thống trang nghiêm dự lễ cưới',
    {
      wearer: 'nam',
      occasion: 'tet_temple',
      traditionalRatio: 85
    }
  );

  assert(
    !test1Sanitized.sanitizedAccessoryIds.includes('quat_giay_tram_huong'),
    '[TEST 1] Sanitizer must strip fan when user did not request it'
  );
  assert(
    test1Sanitized.sanitizedAccessoryIds.includes('khan_dong_truyen_thong'),
    '[TEST 1] Sanitizer preserves legitimate male headwear'
  );
  console.log('[PASS] TEST 1: Male ao_tac ceremonial 85% ratio without fan request -> fan blocked from candidates and stripped by sanitizer');

  // -------------------------------------------------------------------------
  // TEST 2 (MANDATORY): Fan EXPLICIT_ONLY Negative Test for Female Contemporary
  // Input: ao_tac, nu, contemporary/editorial, traditionalRatio: 20, NO fan request
  // Expected: fan NOT available
  // -------------------------------------------------------------------------
  const test2Candidates = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nu',
    occasion: 'street_cafe',
    traditionalRatio: 20,
    promptText: 'Áo tấc đương đại dạo phố cuối tuần chụp ảnh'
  });

  assert(
    !test2Candidates.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 2] Fan must NOT be available in contemporary editorial (ratio 20%) when user did not request it'
  );
  console.log('[PASS] TEST 2: Female ao_tac contemporary 20% ratio without fan request -> fan NOT available');

  // -------------------------------------------------------------------------
  // TEST 3 (MANDATORY): Fan EXPLICIT_ONLY Positive Test
  // Input: compatible contemporary/editorial context, prompt explicitly requests "quạt" / fan
  // Expected: fan MAY become available according to approved policy
  // -------------------------------------------------------------------------
  const test3CandidatesVietnamese = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nu',
    occasion: 'street_cafe',
    traditionalRatio: 40,
    promptText: 'Áo tấc cách tân nhẹ nhàng dạo phố, có cầm quạt giấy làm điểm nhấn'
  });

  assert(
    test3CandidatesVietnamese.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 3] Fan must be available when explicitly requested with "quạt" in compatible context'
  );

  const test3CandidatesEnglish = getPolicyCompatibleAccessories({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    occasion: 'street_cafe',
    traditionalRatio: 30,
    promptText: 'contemporary editorial look holding a folding paper fan'
  });

  assert(
    test3CandidatesEnglish.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 3] Fan must be available when explicitly requested with "fan" in compatible context'
  );
  console.log('[PASS] TEST 3: Compatible contemporary context WITH explicit user fan request -> fan available');

  // -------------------------------------------------------------------------
  // TEST 4 (MANDATORY): Pearl Necklace Regression Tests (Do NOT break pearl behavior)
  // Without explicit pearl request: pearl unavailable
  // With explicit pearl request in compatible contemporary context: pearl available
  // -------------------------------------------------------------------------
  const test4WithoutPearls = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nu',
    occasion: 'street_cafe',
    traditionalRatio: 20,
    promptText: 'Áo tấc đương đại dạo phố thanh lịch'
  });

  assert(
    !test4WithoutPearls.some(a => a.id === 'chuoi_ngoc_trai_co'),
    '[TEST 4] Case A: Without explicit pearl request -> pearl necklace must be UNAVAILABLE even at traditionalRatio 20'
  );

  const test4WithPearls = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nu',
    occasion: 'street_cafe',
    traditionalRatio: 20,
    promptText: 'Áo tấc phối chuỗi ngọc trai cổ thanh lịch cho phong cách đương đại'
  });

  assert(
    test4WithPearls.some(a => a.id === 'chuoi_ngoc_trai_co'),
    '[TEST 4] Case B: With explicit pearl request in compatible contemporary context (ratio 20) -> pearl necklace AVAILABLE'
  );

  // Negative test: pearl in high-traditional ceremonial context is not compatible even if mentioned
  const test4PearlsCeremonial = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nu',
    occasion: 'tet_temple',
    traditionalRatio: 80,
    promptText: 'Áo tấc phối chuỗi ngọc trai dự đại lễ'
  });
  assert(
    !test4PearlsCeremonial.some(a => a.id === 'chuoi_ngoc_trai_co'),
    '[TEST 4] Pearl necklace not compatible in high-traditional ratio (80) even if requested'
  );
  console.log('[PASS] TEST 4: Pearl behavior regression verified (Case A no pearls without request, Case B pearls allowed with request)');

  // -------------------------------------------------------------------------
  // Test 2.5: User negative constraint produces empty candidate list
  // -------------------------------------------------------------------------
  const noAcc = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nam',
    occasion: 'tet_temple',
    traditionalRatio: 70,
    promptText: 'Phong cách tối giản, tuyệt đối không dùng phụ kiện'
  });

  assert(noAcc.length === 0, 'Negative constraint "không phụ kiện" must return 0 accessory candidates');
  console.log('[PASS] 2.5 User negative constraint produces empty candidate list');

  // -------------------------------------------------------------------------
  // 3. GUIDED EXPLORATION ACCESSORY POLICIES
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: GUIDED EXPLORATION ACCESSORY POLICIES ---');

  // -------------------------------------------------------------------------
  // TEST 5 (MANDATORY): Guided Exploration Fan Policy
  // - MORE_TRADITIONAL without explicit fan request -> fan must not appear
  // - MORE_REMIXED without explicit fan request -> fan still must not appear merely because remix level increased
  // - Explicit user fan request + compatible branch -> fan may remain
  // -------------------------------------------------------------------------
  const test5MoreTraditionalNoFan = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 80,
    promptText: 'Áo tấc truyền thống',
    isExploration: true,
    explorationIntent: 'MORE_TRADITIONAL'
  });
  assert(
    !test5MoreTraditionalNoFan.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 5] MORE_TRADITIONAL without fan request -> fan must NOT appear'
  );

  const test5MoreRemixedNoFan = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 25,
    promptText: 'Áo tấc phong cách trẻ trung',
    isExploration: true,
    explorationIntent: 'MORE_REMIXED'
  });
  assert(
    !test5MoreRemixedNoFan.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 5] MORE_REMIXED without fan request -> fan still must NOT appear merely because remix level increased'
  );

  const test5MoreRemixedWithFan = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 30,
    promptText: 'Áo tấc phối quạt nan tre dạo phố',
    isExploration: true,
    explorationIntent: 'MORE_REMIXED'
  });
  assert(
    test5MoreRemixedWithFan.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 5] Explicit fan request + compatible MORE_REMIXED branch -> fan may remain'
  );

  const test5MoreTraditionalWithFan = getPolicyCompatibleAccessories({
    garmentId: 'ao_tac',
    wearer: 'nam',
    traditionalRatio: 75,
    promptText: 'Áo tấc phối quạt nan tre',
    isExploration: true,
    explorationIntent: 'MORE_TRADITIONAL'
  });
  assert(
    !test5MoreTraditionalWithFan.some(a => a.id === 'quat_giay_tram_huong'),
    '[TEST 5] Even with fan request, MORE_TRADITIONAL branch removes contemporary reinterpretation fan'
  );
  console.log('[PASS] TEST 5: Guided Exploration fan policy verified (no fan without request; preserved only in compatible branch with request)');

  // Test 3.1: MORE_TRADITIONAL removes high-remix contemporary accessories
  const moreTradAcc = getPolicyCompatibleAccessories({
    garmentId: 'ngu_than_chen',
    wearer: 'nam',
    traditionalRatio: 60,
    isExploration: true,
    explorationIntent: 'MORE_TRADITIONAL'
  });

  assert(
    !moreTradAcc.some(a => a.id === 'tui_coton_theu_tay' || a.id === 'kinh_ram_gong_tron' || a.id === 'chuoi_ngoc_trai_co'),
    'MORE_TRADITIONAL exploration must filter out contemporary bags, modern eyewear, and pearl necklaces'
  );
  console.log('[PASS] 3.1 MORE_TRADITIONAL filters out contemporary/remix accessories');

  // -------------------------------------------------------------------------
  // 4. VISUAL PROMPT COMPILER SAFETY GUARDRAILS
  // -------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: VISUAL PROMPT COMPILER SAFETY ---');

  const testLookbookRequest: GenerateLookbookRequest = {
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nu',
    remixProposal: {
      palette: [
        { id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'PRIMARY' },
        { id: 'trang_nga_bach_ngoc', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_hoang_cuc', hex: '#D4A017', name: 'Vàng hoàng cúc', role: 'ACCENT' }
      ],
      fabricId: 'to_tam_ha_dong',
      lowerGarmentId: 'silk_pants_wide',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: [] // No accessories
    },
    context: {
      occasion: 'tet_temple',
      style: 'tre_trung',
      traditionalRatio: 80,
      userStyleIntent: 'Thanh lịch truyền thống ngày Tết'
    },
    outfitFingerprint: 'fp_test_123'
  };

  const compiled = compileVisualPrompt(testLookbookRequest);

  // Check no-invention guardrail
  assert(
    compiled.prompt.includes('STRICT NO-INVENTION GUARD'),
    'Compiled prompt must contain STRICT NO-INVENTION GUARD directive'
  );
  assert(
    compiled.prompt.includes('Strictly DO NOT add or invent unrequested crowns'),
    'Prompt must forbid inventing unrequested crowns or imperial headdresses'
  );
  assert(
    compiled.prompt.includes('jade pendants') && compiled.prompt.includes('pearl necklaces'),
    'Prompt must forbid unrequested jade pendants or pearl necklaces'
  );
  assert(
    compiled.prompt.includes('Avoid vague fantasy tropes such as ancient Asian costume'),
    'Prompt must explicitly forbid vague cross-cultural tropes'
  );
  assert(
    compiled.prompt.includes('Hairstyle is natural and understated'),
    'Hairstyle policy for female must default to clean, natural, understated hair without ornate hairpins'
  );

  console.log('[PASS] 4.1 Visual Prompt Compiler enforces v1.1 guardrails, hairstyle policy, and anti-hallucination guards');

  console.log('\n========================================================');
  console.log('G2 CULTURAL PRODUCT RULES v1.1 RUNTIME SUITE: ALL TESTS PASSED');
  console.log('========================================================');
}

runTestSuite().catch(err => {
  console.error(err);
  process.exit(1);
});
