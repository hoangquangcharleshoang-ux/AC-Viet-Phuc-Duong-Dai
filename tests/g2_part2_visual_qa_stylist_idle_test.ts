/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * G2 PART 2 Acceptance Test Suite:
 * - Visual QA Contextual Interpretation & Evidence Authority
 * - Approximate / Probable Measurement Rule (Áo tấc sleeve length)
 * - Contemporary Styling & Unexpected Accessories Isolation
 * - Male Áo Tứ Thân Contemporary Reinterpretation
 * - Revision Preservation & Actionability Invariant
 * - Visual QA Technical Unavailable State
 * - Idle Session 2m30s Warning / 3m00s Reset & In-Flight Safe Deferral
 *
 * MOCK ONLY: ZERO LIVE GEMINI OR OPENAI CALLS.
 */

import {
  aggregateCulturalVisualQA,
  buildGroundedCorrectionPlan,
  CANONICAL_GARMENT_TRAITS,
  QA_SCHEMA_VERSION,
  CULTURAL_KNOWLEDGE_VERSION,
  VISUAL_AUDIT_POLICY_VERSION
} from '../server/services/visualQAAggregator';
import { IdleSessionManager } from '../src/services/idleSessionManager';
import { compileVisualPrompt } from '../server/services/visualPromptCompiler';
import {
  GarmentId,
  RawTraitEvidence,
  RawOutfitFidelityEvidence,
  GenerationSnapshot,
  GenerateLookbookRequest
} from '../src/types/index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  code: string;
  name: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

const results: TestResult[] = [];

function record(code: string, name: string, pass: boolean, detail: string) {
  results.push({
    code,
    name,
    status: pass ? 'PASS' : 'FAIL',
    detail
  });
}

async function runG2Part2Suite() {
  console.log('================================================================');
  console.log('RUNNING G2 PART 2 TEST SUITE (VISUAL QA + STYLIST + IDLE SESSION)');
  console.log('MOCK MODE: ZERO LIVE GEMINI OR OPENAI CALLS');
  console.log('================================================================\n');

  const serverTs = fs.readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');
  const appTs = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
  const idleSessionManagerTs = fs.readFileSync(path.resolve(__dirname, '../src/services/idleSessionManager.ts'), 'utf8');

  // -------------------------------------------------------------------------
  // TEST A: Approximate Áo tấc sleeve length (sleeves_length_past_fingertips)
  // Input: ao_tac, all essential traits PASS, sleeves_length_past_fingertips is PARTIAL or FAIL
  // Expected:
  // - No rigid exact-length correction in culturalDeltas
  // - No CHANGES_CORE_IDENTIFICATION from this alone
  // - Overall status is CONTEXT_SENSITIVE or PRESERVES_IDENTITY
  // -------------------------------------------------------------------------
  const rawTraitsA: RawTraitEvidence[] = [
    { traitId: 'collar_standing_mandarin', verdict: 'PASS', visualEvidence: 'Cổ đứng lập lĩnh ôm khít.' },
    { traitId: 'closure_right_flap_quang', verdict: 'PASS', visualEvidence: 'Cài khuy sang nách phải.' },
    { traitId: 'sleeves_wide_rectangular_box', verdict: 'PASS', visualEvidence: 'Ống tay thụng rộng thẳng hình chữ nhật.' },
    { traitId: 'five_panels_inner_flap', verdict: 'NOT_ASSESSABLE', visualEvidence: 'Lớp trong.' },
    { traitId: 'five_buttons_right', verdict: 'PASS', visualEvidence: '5 khuy nách phải.' },
    { traitId: 'ceremonial_long_silhouette', verdict: 'PASS', visualEvidence: 'Phom dài thụng qua gối.' },
    { traitId: 'sleeves_length_past_fingertips', verdict: 'PARTIAL', visualEvidence: 'Tay người mẫu đang chắp tay, không đo được chính xác 1 tấc qua đầu ngón tay.' }
  ];

  const fidelityA: RawOutfitFidelityEvidence = {
    palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
    fabricMatch: 'PASS',
    lowerGarmentMatch: 'PASS',
    footwearMatch: 'PASS',
    expectedAccessories: [],
    unexpectedAccessories: []
  };

  const snapshotA: GenerationSnapshot = {
    garmentId: 'ao_tac',
    palette: [{ id: 'crimson', role: 'PRIMARY', hex: '#881337', name: 'Đỏ thẫm' }],
    fabricId: 'gam_trung_do',
    lowerGarmentId: 'quan_trang_ong_rong',
    footwearId: 'guoc_moc',
    activeAccessoryIds: [],
    boundFingerprint: 'FP-TEST-A'
  };

  const qaA = aggregateCulturalVisualQA('ao_tac', rawTraitsA, fidelityA, 'gen_a', 'FP-TEST-A');
  const planA = buildGroundedCorrectionPlan('ao_tac', qaA, snapshotA);

  const testAPass =
    qaA.culturalIdentity.overallStatus !== 'CHANGES_CORE_IDENTIFICATION' &&
    qaA.culturalIdentity.overallStatus !== 'WEAKENS_RECOGNIZABILITY' &&
    (qaA.culturalIdentity.overallStatus === 'CONTEXT_SENSITIVE' || qaA.culturalIdentity.overallStatus === 'PRESERVES_IDENTITY') &&
    !planA.culturalDeltas.some(d => d.traitId === 'sleeves_length_past_fingertips') &&
    (planA.actionableDeltas?.length || 0) === 0;

  record(
    'TEST A',
    'Approximate áo tấc sleeve length authority',
    testAPass,
    `sleeves_length_past_fingertips PARTIAL did not trigger rigid correction (culturalDeltas: ${planA.culturalDeltas.length}, status: ${qaA.culturalIdentity.overallStatus})`
  );

  // -------------------------------------------------------------------------
  // TEST B: APPROXIMATE / PROBABLE evidence authority gate
  // Approximate/probable trait mismatch alone cannot cause CHANGES_CORE_IDENTIFICATION
  // -------------------------------------------------------------------------
  const rawTraitsB: RawTraitEvidence[] = [
    { traitId: 'collar_standing_mandarin', verdict: 'PASS', visualEvidence: 'Cổ đứng lập lĩnh.' },
    { traitId: 'closure_right_flap_quang', verdict: 'PASS', visualEvidence: 'Cài khuy phải.' },
    { traitId: 'sleeves_wide_rectangular_box', verdict: 'PASS', visualEvidence: 'Tay thụng.' },
    { traitId: 'sleeves_length_past_fingertips', verdict: 'FAIL', visualEvidence: 'Không phủ qua đầu ngón tay 1 tấc.' }
  ];

  const qaB = aggregateCulturalVisualQA('ao_tac', rawTraitsB, fidelityA, 'gen_b', 'FP-TEST-B');
  const planB = buildGroundedCorrectionPlan('ao_tac', qaB, snapshotA);

  const testBPass =
    qaB.culturalIdentity.overallStatus !== 'CHANGES_CORE_IDENTIFICATION' &&
    !planB.culturalDeltas.some(d => d.traitId === 'sleeves_length_past_fingertips');

  record(
    'TEST B',
    'APPROXIMATE/PROBABLE cannot cause CHANGES_CORE_IDENTIFICATION',
    testBPass,
    `Unverified/probable strongly trait FAIL produced ${qaB.culturalIdentity.overallStatus} without hard cultural delta`
  );

  // -------------------------------------------------------------------------
  // TEST C: Explicit contemporary pearl necklace in snapshot & image
  // Snapshot has chuoi_ngoc_trai_co, image rendered pearl -> Fidelity PASS, no cultural error
  // -------------------------------------------------------------------------
  const snapshotC: GenerationSnapshot = {
    garmentId: 'ngu_than_chen',
    palette: [{ id: 'ivory', role: 'PRIMARY', hex: '#fffff0', name: 'Trắng ngà' }],
    fabricId: 'sa_doan_mong',
    lowerGarmentId: 'quan_lua_den',
    footwearId: 'giay_modern',
    activeAccessoryIds: ['chuoi_ngoc_trai_co'],
    boundFingerprint: 'FP-TEST-C'
  };

  const rawTraitsC: RawTraitEvidence[] = [
    { traitId: 'collar_standing_mandarin', verdict: 'PASS', visualEvidence: 'Cổ đứng.' },
    { traitId: 'closure_right_flap_quang', verdict: 'PASS', visualEvidence: 'Cài nách phải.' },
    { traitId: 'sleeves_fitted_trach_tu', verdict: 'PASS', visualEvidence: 'Tay chẽn.' }
  ];

  const fidelityC: RawOutfitFidelityEvidence = {
    palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
    fabricMatch: 'PASS',
    lowerGarmentMatch: 'PASS',
    footwearMatch: 'PASS',
    expectedAccessories: [
      { accessoryId: 'chuoi_ngoc_trai_co', verdict: 'PASS', notes: 'Chuỗi ngọc trai đeo cổ trang nhã.' }
    ],
    unexpectedAccessories: []
  };

  const qaC = aggregateCulturalVisualQA('ngu_than_chen', rawTraitsC, fidelityC, 'gen_c', 'FP-TEST-C');
  const planC = buildGroundedCorrectionPlan('ngu_than_chen', qaC, snapshotC);

  const testCPass =
    qaC.outfitFidelity.overallFidelity === 'PASS' &&
    qaC.culturalIdentity.overallStatus === 'PRESERVES_IDENTITY' &&
    planC.culturalDeltas.length === 0 &&
    planC.preservationConstraints.some(p => p.includes('chuoi_ngoc_trai_co'));

  record(
    'TEST C',
    'Explicit contemporary pearl necklace fidelity & preservation',
    testCPass,
    `Explicit pearl necklace in snapshot rendered with Fidelity PASS and preserved in constraints`
  );

  // -------------------------------------------------------------------------
  // TEST D: Unexpected accessory isolation
  // Snapshot has no accessories, image contains unrequested items
  // Expected: Fidelity FAIL/PARTIAL, Cultural Identity PRESERVES_IDENTITY
  // -------------------------------------------------------------------------
  const fidelityD: RawOutfitFidelityEvidence = {
    palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
    fabricMatch: 'PASS',
    lowerGarmentMatch: 'PASS',
    footwearMatch: 'PASS',
    expectedAccessories: [],
    unexpectedAccessories: ['mũ beret hiện đại', 'vòng cổ kim loại']
  };

  const qaD = aggregateCulturalVisualQA('ngu_than_chen', rawTraitsC, fidelityD, 'gen_d', 'FP-TEST-D');
  const planD = buildGroundedCorrectionPlan('ngu_than_chen', qaD, snapshotA);

  const testDPass =
    qaD.outfitFidelity.overallFidelity === 'FAIL' &&
    qaD.culturalIdentity.overallStatus === 'PRESERVES_IDENTITY' &&
    planD.fidelityDeltas.some(d => d.element === 'accessories') &&
    planD.culturalDeltas.length === 0;

  record(
    'TEST D',
    'Unexpected accessory fidelity isolation',
    testDPass,
    `Unexpected modern accessories triggered Fidelity FAIL while Cultural Identity preserved (${qaD.culturalIdentity.overallStatus})`
  );

  // -------------------------------------------------------------------------
  // TEST E: Male contemporary áo tứ thân
  // Wearer nam + ao_tu_than in contemporary reinterpretation branch
  // Expected: Male wearer is not a cultural failure; anatomical traits preserved
  // -------------------------------------------------------------------------
  const rawTraitsE: RawTraitEvidence[] = [
    { traitId: 'four_panels_structure', verdict: 'PASS', visualEvidence: 'Cấu trúc 4 thân vải.' },
    { traitId: 'front_open_no_chest_buttons', verdict: 'PASS', visualEvidence: 'Thân trước mở vạt.' },
    { traitId: 'front_flaps_hanging_or_tied', verdict: 'PASS', visualEvidence: 'Vạt trước buông tự nhiên.' }
  ];

  const snapshotE: GenerationSnapshot = {
    garmentId: 'ao_tu_than',
    palette: [{ id: 'charcoal', role: 'PRIMARY', hex: '#1c1917', name: 'Đen than' }],
    fabricId: 'linen_tho',
    lowerGarmentId: 'quan_lua_den',
    footwearId: 'giay_modern',
    activeAccessoryIds: [],
    boundFingerprint: 'FP-TEST-E',
    genderPresentation: 'nam'
  };

  const qaE = aggregateCulturalVisualQA('ao_tu_than', rawTraitsE, fidelityA, 'gen_e', 'FP-TEST-E');
  const planE = buildGroundedCorrectionPlan('ao_tu_than', qaE, snapshotE);

  const testEPass =
    qaE.culturalIdentity.overallStatus === 'PRESERVES_IDENTITY' &&
    planE.culturalDeltas.length === 0;

  record(
    'TEST E',
    'Male contemporary áo tứ thân structural evaluation',
    testEPass,
    `Anatomical traits of contemporary male áo tứ thân passed with PRESERVES_IDENTITY`
  );

  // -------------------------------------------------------------------------
  // TEST F: NOT_ASSESSABLE never becomes correction target
  // -------------------------------------------------------------------------
  const rawTraitsF: RawTraitEvidence[] = [
    { traitId: 'collar_standing_mandarin', verdict: 'NOT_ASSESSABLE', visualEvidence: 'Bị che khuất bởi góc máy cận cảnh.' },
    { traitId: 'closure_right_flap_quang', verdict: 'NOT_ASSESSABLE', visualEvidence: 'Không thấy vạt.' },
    { traitId: 'sleeves_fitted_trach_tu', verdict: 'NOT_ASSESSABLE', visualEvidence: 'Khuất góc chụp.' }
  ];

  const qaF = aggregateCulturalVisualQA('ngu_than_chen', rawTraitsF, fidelityA, 'gen_f', 'FP-TEST-F');
  const planF = buildGroundedCorrectionPlan('ngu_than_chen', qaF, snapshotA);

  const testFPass =
    qaF.culturalIdentity.overallStatus === 'INSUFFICIENT_EVIDENCE' &&
    planF.culturalDeltas.length === 0 &&
    (planF.actionableDeltas?.length || 0) === 0;

  record(
    'TEST F',
    'NOT_ASSESSABLE produces 0 correction deltas',
    testFPass,
    `3/3 NOT_ASSESSABLE produced INSUFFICIENT_EVIDENCE and exactly 0 correction deltas`
  );

  // -------------------------------------------------------------------------
  // TEST G: Actionability count invariant
  // actionableCount === correctionPlan.actionableDeltas.length
  // -------------------------------------------------------------------------
  const rawTraitsG: RawTraitEvidence[] = [
    { traitId: 'collar_standing_mandarin', verdict: 'FAIL', visualEvidence: 'Cổ áo may bẻ ve âu phục.' },
    { traitId: 'closure_right_flap_quang', verdict: 'PASS', visualEvidence: 'Cài khuy phải.' },
    { traitId: 'sleeves_fitted_trach_tu', verdict: 'PASS', visualEvidence: 'Tay chẽn.' }
  ];

  const fidelityG: RawOutfitFidelityEvidence = {
    palette: { primaryMatch: 'FAIL', supportingMatch: 'PASS', accentMatch: 'PASS', notes: 'Màu đỏ thay vì màu xanh.' },
    fabricMatch: 'PASS',
    lowerGarmentMatch: 'PASS',
    footwearMatch: 'PASS',
    expectedAccessories: [],
    unexpectedAccessories: []
  };

  const qaG = aggregateCulturalVisualQA('ngu_than_chen', rawTraitsG, fidelityG, 'gen_g', 'FP-TEST-G');
  const planG = buildGroundedCorrectionPlan('ngu_than_chen', qaG, snapshotA);

  const actionableLen = planG.actionableDeltas?.length || 0;
  const testGPass =
    planG.culturalDeltas.length === 1 &&
    planG.fidelityDeltas.length === 1 &&
    actionableLen === 2 &&
    actionableLen === planG.culturalDeltas.length + planG.fidelityDeltas.length;

  record(
    'TEST G',
    'Actionability count exact match invariant',
    testGPass,
    `actionableCount (${actionableLen}) === culturalDeltas (${planG.culturalDeltas.length}) + fidelityDeltas (${planG.fidelityDeltas.length})`
  );

  // -------------------------------------------------------------------------
  // TEST H: Revision preservation
  // V1 structural correction preserves approved accessories & constraints
  // -------------------------------------------------------------------------
  const reqH: GenerateLookbookRequest = {
    garmentId: 'ngu_than_chen',
    outfitFingerprint: 'FP-TEST-H',
    revisionIndex: 1,
    groundedCorrectionPlan: planG,
    remixProposal: {
      palette: [{ id: 'indigo', role: 'PRIMARY', name: 'Xanh chàm', hex: '#1e3a8a' }],
      fabricId: 'linen_tho',
      lowerGarmentId: 'quan_the_the',
      footwearId: 'leather_loafer',
      accessoryIds: ['chuoi_ngoc_trai_co']
    },
    context: {
      occasion: 'street_cafe',
      style: 'contemporary_editorial',
      traditionalRatio: 20,
      genderPresentation: 'nu'
    }
  };

  const compiledPromptH = compileVisualPrompt(reqH);
  const testHPass =
    compiledPromptH.prompt.includes('CRITICAL CULTURAL REVISIONS (REVISION 1)') &&
    compiledPromptH.prompt.includes('collar_standing_mandarin') &&
    compiledPromptH.prompt.includes('STYLING FIDELITY CORRECTION [palette]') &&
    compiledPromptH.prompt.includes('LOCKED PRESERVATION CONSTRAINTS') &&
    compiledPromptH.prompt.includes('female Vietnamese model');

  record(
    'TEST H',
    'V1 Revision prompt preservation of identity and constraints',
    testHPass,
    `Compiled prompt contains targeted cultural/fidelity revisions and locked preservation constraints`
  );

  // -------------------------------------------------------------------------
  // TEST I: Visual QA technical unavailable state & boundary
  // Provider error / timeout / non-JSON HTML proxy -> sets error, image remains, no fake cultural verdict
  // -------------------------------------------------------------------------
  const testIPass =
    appTs.includes("status: 'error'") &&
    appTs.includes('retryable: err.retryable ?? true') &&
    !appTs.includes("status: 'error', result: { culturalIdentity: { overallStatus:") &&
    serverTs.includes("code: 'INVALID_QA_REQUEST'") &&
    serverTs.includes('serverVisualQACache.has(qaCacheKey)');

  record(
    'TEST I',
    'QA technical unavailable boundary',
    testIPass,
    `Client sets error state with retryable flag and preserves lookbook image with 0 fake cultural verdicts`
  );

  // -------------------------------------------------------------------------
  // TEST J: Idle Session Timing (2m30s warning, 3m00s reset)
  // -------------------------------------------------------------------------
  let warningCalled = false;
  let dismissCalled = false;
  let resetCalled = false;
  let inFlight = false;

  const idleManager = new IdleSessionManager({
    warningThresholdMs: 150000, // 2m30s
    resetThresholdMs: 180000,   // 3m00s
    checkIntervalMs: 1000,
    onShowWarning: () => { warningCalled = true; },
    onDismissWarning: () => { dismissCalled = true; },
    onTriggerReset: () => { resetCalled = true; },
    isWorkInFlight: () => inFlight
  });

  // Time = 0s
  idleManager.checkTick();
  const j0Pass = !warningCalled && !resetCalled;

  // Simulate time = 2m29s (149,000ms)
  (idleManager as any).lastUserActivityTime = Date.now() - 149000;
  idleManager.checkTick();
  const j1Pass = !warningCalled && !resetCalled;

  // Simulate time = 2m30s (150,000ms)
  (idleManager as any).lastUserActivityTime = Date.now() - 150000;
  idleManager.checkTick();
  const j2Pass = warningCalled && !resetCalled && idleManager.isWarningShown;

  // Simulate user activity during warning
  idleManager.recordUserActivity();
  const j3Pass = dismissCalled && !idleManager.isWarningShown && idleManager.getElapsedIdleMs() < 100;

  // Simulate time = 3m00s (180,000ms)
  (idleManager as any).lastUserActivityTime = Date.now() - 180000;
  idleManager.checkTick();
  const j4Pass = resetCalled;

  const testJPass = j0Pass && j1Pass && j2Pass && j3Pass && j4Pass;
  record(
    'TEST J',
    'Idle session timing (2m30s warning, 3m00s canonical reset)',
    testJPass,
    `2m29s -> no warning; 2m30s -> warning; user activity -> dismissed; 3m00s -> canonical reset`
  );

  // -------------------------------------------------------------------------
  // TEST K: In-flight safe idle deferral
  // 3m00s inactivity while work is in-flight -> reset deferred until settled
  // -------------------------------------------------------------------------
  let resetCalledK = false;
  let warningCalledK = false;
  let workInFlightK = true;

  const idleManagerK = new IdleSessionManager({
    warningThresholdMs: 150000,
    resetThresholdMs: 180000,
    checkIntervalMs: 1000,
    onShowWarning: () => { warningCalledK = true; },
    onDismissWarning: () => {},
    onTriggerReset: () => { resetCalledK = true; },
    isWorkInFlight: () => workInFlightK
  });

  // Time reaches 3m00s while work in-flight
  (idleManagerK as any).lastUserActivityTime = Date.now() - 181000;
  idleManagerK.checkTick();

  const k1Pass = !resetCalledK && idleManagerK.isResetDeferred;

  // Work completes / settles
  workInFlightK = false;
  idleManagerK.onWorkSettled();

  const k2Pass = resetCalledK && !idleManagerK.isResetDeferred;

  const testKPass = k1Pass && k2Pass;
  record(
    'TEST K',
    'Safe in-flight idle reset deferral',
    testKPass,
    `Reset deferred during in-flight generation/QA and applied safely once work settled`
  );

  // -------------------------------------------------------------------------
  // Print Results
  // -------------------------------------------------------------------------
  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log('| Code   | Test Name                                            | Status | Evidence Summary                            |');
  console.log('------------------------------------------------------------------------------------------------------------------------');
  for (const r of results) {
    const codeStr = r.code.padEnd(6, ' ');
    const nameStr = r.name.padEnd(52, ' ');
    const statusStr = r.status.padEnd(6, ' ');
    console.log(`| ${codeStr} | ${nameStr} | ${statusStr} | ${r.detail.slice(0, 44).padEnd(44, ' ')} |`);
  }
  console.log('------------------------------------------------------------------------------------------------------------------------\n');

  const failedCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.length - failedCount} | FAILED: ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runG2Part2Suite().catch(err => {
  console.error('G2 Part 2 test suite execution error:', err);
  process.exit(1);
});
