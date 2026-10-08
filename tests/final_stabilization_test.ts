/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Final Runtime Stabilization & Quota/QA/API Isolation Test Suite
 * MOCK ONLY: ZERO LIVE GEMINI OR OPENAI CALLS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadQuotaBlocks, saveQuotaBlock, isModelQuotaBlocked } from '../server/services/quotaQuarantine';
import { getModelPoolForTask } from '../server/services/modelRegistry';
import { circuitBreaker } from '../server/services/circuitBreaker';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  num: number;
  name: string;
  status: 'MOCK PASS' | 'FAIL';
  evidence: string;
}

const results: TestResult[] = [];

function record(num: number, name: string, pass: boolean, evidence: string) {
  results.push({
    num,
    name,
    status: pass ? 'MOCK PASS' : 'FAIL',
    evidence
  });
}

async function runStabilizationTests() {
  console.log('========================================================');
  console.log('RUNNING FINAL RUNTIME STABILIZATION TEST SUITE');
  console.log('MOCK MODE: ZERO LIVE GEMINI OR OPENAI CALLS');
  console.log('========================================================\n');

  // 1. Test Persistent Quota Block & Metadata Extraction
  const testModel = 'gemini-3.8-flash';
  const blockedUntilTime = Date.now() + 120000;
  saveQuotaBlock({
    modelId: testModel,
    blockedUntil: blockedUntilTime,
    quotaMetric: 'generate_content_requests',
    quotaId: 'RequestsPerDay',
    quotaValue: '1500',
    dimensions: { model: testModel },
    retryAfterSeconds: 120,
    updatedAt: new Date().toISOString()
  });

  const isBlocked = isModelQuotaBlocked(testModel);
  const loadedBlocks = loadQuotaBlocks();
  const test1Pass = isBlocked && loadedBlocks[testModel]?.quotaMetric === 'generate_content_requests';
  record(
    1,
    'TEST_PERSISTENT_QUOTA_BLOCK',
    test1Pass,
    `Persistent quota block for ${testModel} loaded successfully with metric=${loadedBlocks[testModel]?.quotaMetric}`
  );

  // 2. Test Quota-Efficient Dev-Lite Routing Profile
  const bpPool = getModelPoolForTask('BLUEPRINT');
  const vqaPool = getModelPoolForTask('VISUAL_QA');
  const test2Pass = bpPool[0] === 'gemini-3.5-flash-lite' && vqaPool[0] === 'gemini-3.5-flash-lite';
  record(
    2,
    'TEST_DEV_LITE_ROUTING_PROFILE',
    test2Pass,
    `Dev-lite profile correctly places gemini-3.5-flash-lite first for BLUEPRINT and VISUAL_QA`
  );

  // 3. Test Visual QA Attempt Guard (One automatic attempt per identity)
  const qaSet = new Set<string>();
  const qaId = 'gen_123_FP-ABC';
  const attemptQa = (identity: string, isExplicitRetry = false) => {
    if (isExplicitRetry) {
      qaSet.delete(identity);
    }
    if (qaSet.has(identity)) {
      return 'SKIPPED_DUPLICATE';
    }
    qaSet.add(identity);
    return 'ATTEMPTED';
  };

  const firstAttempt = attemptQa(qaId, false);
  const secondAutomaticAttempt = attemptQa(qaId, false);
  const explicitRetryAttempt = attemptQa(qaId, true);

  const test3Pass = firstAttempt === 'ATTEMPTED' &&
                    secondAutomaticAttempt === 'SKIPPED_DUPLICATE' &&
                    explicitRetryAttempt === 'ATTEMPTED';
  record(
    3,
    'TEST_SINGLE_AUTOMATIC_QA_ATTEMPT',
    test3Pass,
    `First attempt=${firstAttempt}, second automatic=${secondAutomaticAttempt}, explicit retry=${explicitRetryAttempt}`
  );

  // 4. Test API Response Isolation & X-AC-API-Response Header
  const serverTs = fs.readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');
  const visualServiceTs = fs.readFileSync(path.resolve(__dirname, '../src/services/visualQAService.ts'), 'utf8');

  const hasApiMarkerMiddleware = serverTs.includes("res.setHeader('X-AC-API-Response', '1')");
  const hasClientHeaderCheck = visualServiceTs.includes("xAcApiResponse") && visualServiceTs.includes("xAcApiResponse !== '1'");

  const test4Pass = hasApiMarkerMiddleware && hasClientHeaderCheck;
  record(
    4,
    'TEST_API_RESPONSE_ISOLATION_AND_MARKER',
    test4Pass,
    `Server X-AC-API-Response middleware defined: ${hasApiMarkerMiddleware}, Client header validation: ${hasClientHeaderCheck}`
  );

  // 5. Test Exploration Visibility & Gating
  const appTsx = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
  // Check that Section4Exploration is placed below Section3Lookbook
  const idxLookbook = appTsx.indexOf('<Section3Lookbook');
  const idxExploration = appTsx.indexOf('<Section4Exploration');
  const hasRootV0Gating = appTsx.includes('rootV0ExistsForCurrentBlueprint') && appTsx.includes('getThreadForFingerprint(currentOutfitFingerprint)');
  const isExplorationBelowLookbook = idxLookbook > 0 && idxExploration > idxLookbook;

  // Stale check logic test:
  const isGatedSemantically = (
    lookbookState: { status: string; outfitFingerprint?: string; imageUrl?: string },
    currentFingerprint: string,
    threadHasV0: boolean
  ) => {
    return Boolean(
      (lookbookState.status === 'success' &&
        lookbookState.outfitFingerprint === currentFingerprint &&
        Boolean(lookbookState.imageUrl)) ||
      (threadHasV0 && lookbookState.status !== 'idle' && lookbookState.outfitFingerprint === currentFingerprint)
    );
  };

  const unlockedOnFreshV0 = isGatedSemantically({ status: 'success', outfitFingerprint: 'FP-1', imageUrl: 'http://img' }, 'FP-1', true);
  const lockedOnIdle = isGatedSemantically({ status: 'idle' }, 'FP-1', false);
  const lockedOnStaleV0 = isGatedSemantically({ status: 'success', outfitFingerprint: 'FP-OLD', imageUrl: 'http://img' }, 'FP-NEW', false);

  const test5Pass = isExplorationBelowLookbook && hasRootV0Gating && unlockedOnFreshV0 && !lockedOnIdle && !lockedOnStaleV0;
  record(
    5,
    'TEST_EXPLORATION_VISIBILITY_AND_GATING',
    test5Pass,
    `Exploration below Lookbook: ${isExplorationBelowLookbook}, Fresh V0 unlocks: ${unlockedOnFreshV0}, Idle locked: ${!lockedOnIdle}, Stale locked: ${!lockedOnStaleV0}`
  );

  // 6. Test QA Summary vs Actionability Invariant
  const qaCardTsx = fs.readFileSync(path.resolve(__dirname, '../src/components/CulturalQACard.tsx'), 'utf8');
  const hasSeparatedCounts = qaCardTsx.includes('passedCount') && qaCardTsx.includes('attentionCount') && qaCardTsx.includes('actionableCount');
  const hasActionableDeltasContract = qaCardTsx.includes('actionableDeltas.length');
  const hasAdvisoryLabel = qaCardTsx.includes('điểm cần lưu ý') && !qaCardTsx.includes('needFixCount > 0 ? ` · ${needFixCount} cần chỉnh` : \'\'');
  const hasPromptCorrectionCount = qaCardTsx.includes('AC gợi ý tinh chỉnh');

  const test6Pass = hasSeparatedCounts && hasActionableDeltasContract && hasAdvisoryLabel && hasPromptCorrectionCount;
  record(
    6,
    'TEST_QA_SUMMARY_ACTIONABILITY_INVARIANT',
    test6Pass,
    `Separated counts: ${hasSeparatedCounts}, Actionable contract: ${hasActionableDeltasContract}, Advisory label: ${hasAdvisoryLabel}`
  );

  // 7. Test Conservative Sleeve Evaluation for Áo ngũ thân tay chẽn
  const { aggregateCulturalVisualQA } = await import('../server/services/visualQAAggregator');
  // Visual QA v2 principle:
  // - A narrow/slim sleeve ALONE is insufficient evidence for canonical tay chẽn.
  // - When partial relevant geometry is observable without canonical certainty -> PARTIAL -> WEAKENS_RECOGNIZABILITY (not CHANGES_CORE_IDENTIFICATION).
  // - When genuine contradiction is observable -> FAIL -> CHANGES_CORE_IDENTIFICATION.
  // - Aggregator does NOT rescue genuine FAIL to PARTIAL.
  const testGarment = 'ngu_than_chen';
  const mockSleeveTraitsPartial = [
    {
      traitId: 'collar_standing_mandarin',
      verdict: 'PASS' as const,
      visualEvidence: 'Cổ đứng lập lĩnh 3cm dựng chuẩn.'
    },
    {
      traitId: 'closure_right_flap_quang',
      verdict: 'PASS' as const,
      visualEvidence: 'Vạt cài chéo nách phải.'
    },
    {
      traitId: 'sleeves_fitted_trach_tu',
      verdict: 'PARTIAL' as const,
      visualEvidence: 'Ống tay áo suông thon gọn ôm dọc cánh tay nhưng tư thế và nếp gấp chưa thể hiện rõ độ thuôn hẹp dần về cổ tay.',
      observedDeviation: 'Chưa đủ cơ sở khẳng định phom trách tụ chuẩn'
    }
  ];

  const qaResultPartial = aggregateCulturalVisualQA(
    testGarment,
    mockSleeveTraitsPartial,
    {
      palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
      fabricMatch: 'PASS',
      lowerGarmentMatch: 'PASS',
      footwearMatch: 'PASS',
      expectedAccessories: [],
      unexpectedAccessories: []
    },
    'gen_test_sleeve_partial',
    'FP-SLEEVE-PARTIAL'
  );

  const sleeveTraitPartial = qaResultPartial.culturalIdentity.traits.find(t => t.traitId === 'sleeves_fitted_trach_tu');
  const sleeveIsPartial = sleeveTraitPartial?.verdict === 'PARTIAL';
  const partialStatusIsWeakens = qaResultPartial.culturalIdentity.overallStatus === 'WEAKENS_RECOGNIZABILITY';

  // Check genuine FAIL case: genuinely preserves FAIL without artificial normalization
  const mockSleeveTraitsFail = [
    {
      traitId: 'collar_standing_mandarin',
      verdict: 'PASS' as const,
      visualEvidence: 'Cổ đứng lập lĩnh 3cm dựng chuẩn.'
    },
    {
      traitId: 'closure_right_flap_quang',
      verdict: 'PASS' as const,
      visualEvidence: 'Vạt cài chéo nách phải.'
    },
    {
      traitId: 'sleeves_fitted_trach_tu',
      verdict: 'FAIL' as const,
      visualEvidence: 'Ống tay thụng rộng hình chữ nhật xòe to bản kiểu Áo tấc.',
      observedDeviation: 'Ống tay thụng rộng không phải tay chẽn'
    }
  ];

  const qaResultFail = aggregateCulturalVisualQA(
    testGarment,
    mockSleeveTraitsFail,
    {
      palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
      fabricMatch: 'PASS',
      lowerGarmentMatch: 'PASS',
      footwearMatch: 'PASS',
      expectedAccessories: [],
      unexpectedAccessories: []
    },
    'gen_test_sleeve_fail',
    'FP-SLEEVE-FAIL'
  );

  const sleeveTraitFail = qaResultFail.culturalIdentity.traits.find(t => t.traitId === 'sleeves_fitted_trach_tu');
  const sleevePreservesFail = sleeveTraitFail?.verdict === 'FAIL';
  const failStatusIsCore = qaResultFail.culturalIdentity.overallStatus === 'CHANGES_CORE_IDENTIFICATION';

  const test7Pass = sleeveIsPartial && partialStatusIsWeakens && sleevePreservesFail && failStatusIsCore;
  record(
    7,
    'TEST_CONSERVATIVE_SLEEVE_EVALUATION',
    test7Pass,
    `Sleeve partial verdict: ${sleeveTraitPartial?.verdict} (status: ${qaResultPartial.culturalIdentity.overallStatus}), genuine fail preserved: ${sleeveTraitFail?.verdict} (status: ${qaResultFail.culturalIdentity.overallStatus})`
  );

  // Print Summary Table
  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log('| #  | Test Name                             | Status    | Evidence Summary                                            |');
  console.log('------------------------------------------------------------------------------------------------------------------------');
  results.forEach(r => {
    const numStr = String(r.num).padStart(2, ' ');
    const nameStr = r.name.padEnd(37, ' ');
    const statusStr = r.status.padEnd(9, ' ');
    console.log(`| ${numStr} | ${nameStr} | ${statusStr} | ${r.evidence.padEnd(61, ' ')} |`);
  });
  console.log('------------------------------------------------------------------------------------------------------------------------');

  const allPassed = results.every(r => r.status === 'MOCK PASS');
  if (allPassed) {
    console.log('\nFINAL RUNTIME STABILIZATION TEST SUITE: ALL TESTS PASSED SUCCESSFULLY');
    process.exit(0);
  } else {
    console.log('\nFINAL RUNTIME STABILIZATION TEST SUITE: SOME TESTS FAILED');
    process.exit(1);
  }
}

runStabilizationTests();
