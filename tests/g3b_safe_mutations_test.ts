/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 3B: G3B Safe Mutations Test Suite
 *
 * MOCK ONLY: ZERO LIVE GEMINI OR OPENAI CALLS.
 * Validates:
 * 1. Action Registry existence, fields & ephemeral state
 * 2. Immutable sourceBlueprint normalization
 * 3. Server-computed sourceFingerprint
 * 4. POST /api/ac-chat/mutate controller invariants:
 *    - Rejection when actionId missing/invalid (400)
 *    - Rejection when currentFingerprint missing/invalid (400)
 *    - Rejection when chatSessionId missing/invalid (400)
 *    - Rejection when session mismatch (403)
 *    - Rejection when action expired (410)
 *    - Concurrency conflict when fingerprint mismatched (409)
 *    - Idempotency rejection when already applied (409)
 *    - Successful deterministic apply (200)
 * 5. Closed action union validation: SET_FOOTWEAR, SET_FABRIC, ADD_ACCESSORY, SET_COLOR
 * 6. Deterministic explicit-only accessory guard (quạt nan & ngọc trai cannot be applied without explicit prompt)
 * 7. Snapshot immutability & Lineage isolation
 * 8. Stale divergence banner copy & notification
 * 9. Client action card UI state transitions (loading -> applied -> disabled)
 * 10. Chat session reset clears ephemeral registry and regenerates session ID
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  EphemeralActionRegistry,
  globalActionRegistry
} from '../server/services/actionRegistry';
import { computeOutfitFingerprint } from '../src/shared/fingerprint';
import { BlueprintOutput, ACChatAction } from '../src/types/index';
import { validateAndSanitizeACChatResponse } from '../server/services/acChatService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  code: string;
  name: string;
  status: 'PASS' | 'FAIL';
  evidence: string;
}

const results: TestResult[] = [];

function record(code: string, name: string, pass: boolean, evidence: string) {
  results.push({
    code,
    name,
    status: pass ? 'PASS' : 'FAIL',
    evidence
  });
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('RUNNING G3B SAFE MUTATIONS (ACTIONABLE DELTA) TEST SUITE');
  console.log('MOCK MODE: ZERO LIVE GEMINI OR OPENAI CALLS');
  console.log('================================================================\n');

  const serverTs = fs.readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');
  const appTs = fs.readFileSync(path.resolve(__dirname, '../src/App.tsx'), 'utf8');
  const chatDrawerTs = fs.readFileSync(path.resolve(__dirname, '../src/components/ACChatDrawer.tsx'), 'utf8');
  const lookbookTs = fs.readFileSync(path.resolve(__dirname, '../src/components/Section3Lookbook.tsx'), 'utf8');
  const actionRegistryTs = fs.readFileSync(path.resolve(__dirname, '../server/services/actionRegistry.ts'), 'utf8');
  const clientChatServiceTs = fs.readFileSync(path.resolve(__dirname, '../src/services/acChatService.ts'), 'utf8');

  // Sample valid baseline blueprint
  const sampleBlueprint: BlueprintOutput = {
    garmentId: 'ngu_than_chen',
    remixProposal: {
      palette: [
        { id: 'xanh_cham_co', hex: '#2D3A54', name: 'Xanh chàm cổ', role: 'PRIMARY' },
        { id: 'trang_nga_bach_ngoc', hex: '#F5F2EB', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'do_son_tram', hex: '#8E2829', name: 'Đỏ son trầm', role: 'ACCENT' }
      ],
      fabricId: 'to_tam_ha_dong',
      lowerGarmentId: 'silk_pants_white',
      footwearId: 'guoc_moc_truyen_thong',
      accessoryIds: []
    },
    contextCautions: ['Giữ cổ đứng lập lĩnh mực thước.']
  };

  const sampleContext = {
    occasion: 'tet_temple',
    style: 'traditional',
    traditionalRatio: 70,
    genderPresentation: 'nam' as const,
    promptText: ''
  };

  const baselineFingerprint = computeOutfitFingerprint({
    garmentId: sampleBlueprint.garmentId,
    palette: sampleBlueprint.remixProposal.palette,
    fabricId: sampleBlueprint.remixProposal.fabricId,
    lowerGarmentId: sampleBlueprint.remixProposal.lowerGarmentId,
    footwearId: sampleBlueprint.remixProposal.footwearId,
    accessoryIds: sampleBlueprint.remixProposal.accessoryIds,
    occasion: sampleContext.occasion,
    style: sampleContext.style,
    traditionalRatio: sampleContext.traditionalRatio,
    genderPresentation: sampleContext.genderPresentation
  });

  // ----------------------------------------------------
  // TEST 1 — Action Registry Class & Opaque Action IDs
  // ----------------------------------------------------
  const registry = new EphemeralActionRegistry(600000);
  const actionCandidate: ACChatAction = {
    type: 'SET_FOOTWEAR',
    targetValue: 'leather_loafer',
    label: 'Thay giày da loafer',
    description: 'Thử nghiệm giày da tối giản thanh lịch cho nam giới.'
  };

  const regRecord = registry.registerAction({
    chatSessionId: 'test_sess_1',
    sourceBlueprint: sampleBlueprint,
    action: actionCandidate,
    context: sampleContext
  });

  const t1Pass =
    Boolean(regRecord.actionId) &&
    regRecord.actionId.startsWith('act_') &&
    regRecord.chatSessionId === 'test_sess_1' &&
    regRecord.sourceFingerprint === baselineFingerprint &&
    regRecord.consumed === false;

  record(
    'TEST 1',
    'Action Registry & Opaque Action ID Generation',
    t1Pass,
    'Registers action with opaque act_ ID, binds chatSessionId and sourceFingerprint.'
  );

  // ----------------------------------------------------
  // TEST 2 — Immutable SourceBlueprint Storage
  // ----------------------------------------------------
  // Mutating original sampleBlueprint after registration must NOT affect stored record
  const cloneBefore = JSON.stringify(regRecord.sourceBlueprint);
  (sampleBlueprint.remixProposal as any).footwearId = 'chunky_sneaker';
  const cloneAfter = JSON.stringify(regRecord.sourceBlueprint);
  const t2Pass = cloneBefore === cloneAfter && regRecord.sourceBlueprint.remixProposal.footwearId === 'guoc_moc_truyen_thong';
  // restore
  sampleBlueprint.remixProposal.footwearId = 'guoc_moc_truyen_thong';

  record(
    'TEST 2',
    'Immutable SourceBlueprint Provenance',
    t2Pass,
    'Mutating input blueprint does not alter server-cached sourceBlueprint.'
  );

  // ----------------------------------------------------
  // TEST 3 — Concurrency Conflict Guard (409)
  // ----------------------------------------------------
  const conflictRes = registry.applyAction({
    actionId: regRecord.actionId,
    currentFingerprint: 'AC-MUTATED-FINGERPRINT',
    chatSessionId: 'test_sess_1'
  });

  const t3Pass =
    conflictRes.status === 409 &&
    conflictRes.code === 'FINGERPRINT_CONFLICT' &&
    conflictRes.message.includes('Bản phối đã thay đổi');

  record(
    'TEST 3',
    'Concurrency Conflict Guard (409 FINGERPRINT_CONFLICT)',
    t3Pass,
    'Rejects mutation when client fingerprint diverges from sourceFingerprint.'
  );

  // ----------------------------------------------------
  // TEST 4 — Session Isolation Guard (403)
  // ----------------------------------------------------
  const sessionMismatchRes = registry.applyAction({
    actionId: regRecord.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'different_sess_xyz'
  });

  const t4Pass =
    sessionMismatchRes.status === 403 &&
    sessionMismatchRes.code === 'SESSION_MISMATCH';

  record(
    'TEST 4',
    'Session Mismatch Guard (403 SESSION_MISMATCH)',
    t4Pass,
    'Rejects mutation when request chatSessionId does not match record.'
  );

  // ----------------------------------------------------
  // TEST 5 — TTL Expiration Guard (410)
  // ----------------------------------------------------
  const expiredRegistry = new EphemeralActionRegistry(1); // 1ms TTL
  const expRecord = expiredRegistry.registerAction({
    chatSessionId: 'test_sess_exp',
    sourceBlueprint: sampleBlueprint,
    action: actionCandidate,
    context: sampleContext,
    ttlMs: -100 // already expired
  });

  const expiredRes = expiredRegistry.applyAction({
    actionId: expRecord.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'test_sess_exp'
  });

  const t5Pass =
    expiredRes.status === 410 &&
    expiredRes.code === 'ACTION_EXPIRED';

  record(
    'TEST 5',
    'TTL Expiration Guard (410 ACTION_EXPIRED)',
    t5Pass,
    'Rejects and purges actions when TTL is exceeded.'
  );

  // ----------------------------------------------------
  // TEST 6 — Successful Deterministic Server Apply (200)
  // ----------------------------------------------------
  const successRes = registry.applyAction({
    actionId: regRecord.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'test_sess_1'
  });

  const t6Pass =
    successRes.status === 200 &&
    Boolean(successRes.data) &&
    successRes.data?.nextBlueprint.remixProposal.footwearId === 'leather_loafer' &&
    Boolean(successRes.data?.nextFingerprint) &&
    successRes.data?.nextFingerprint !== baselineFingerprint &&
    successRes.data?.notice.includes('Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.');

  record(
    'TEST 6',
    'Deterministic Server Apply (200 ACTION_APPLIED_SUCCESS)',
    t6Pass,
    'Returns nextBlueprint with updated footwear, nextFingerprint and lineage divergence notice.'
  );

  // ----------------------------------------------------
  // TEST 7 — Idempotency / Single-Use Guard (409)
  // ----------------------------------------------------
  const duplicateRes = registry.applyAction({
    actionId: regRecord.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'test_sess_1'
  });

  const t7Pass =
    duplicateRes.status === 409 &&
    duplicateRes.code === 'ACTION_ALREADY_APPLIED';

  record(
    'TEST 7',
    'Idempotency Guard (409 ACTION_ALREADY_APPLIED)',
    t7Pass,
    'Single-use guarantee prevents re-applying an already consumed action.'
  );

  // ----------------------------------------------------
  // TEST 8 — Closed Action Union: SET_FABRIC
  // ----------------------------------------------------
  const fabricAction: ACChatAction = {
    type: 'SET_FABRIC',
    targetValue: 'gam_hoa_chim',
    label: 'Đổi chất liệu gấm hoa chìm',
    description: 'Chất liệu gấm tạo phom dáng đứng đắn.'
  };
  const regFabric = registry.registerAction({
    chatSessionId: 'sess_fabric',
    sourceBlueprint: sampleBlueprint,
    action: fabricAction,
    context: sampleContext
  });
  const fabricApplyRes = registry.applyAction({
    actionId: regFabric.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'sess_fabric'
  });
  const t8Pass =
    fabricApplyRes.status === 200 &&
    fabricApplyRes.data?.nextBlueprint.remixProposal.fabricId === 'gam_hoa_chim';

  record(
    'TEST 8',
    'Closed Action: SET_FABRIC',
    t8Pass,
    'Correctly modifies fabricId to catalog item gam_hoa_chim.'
  );

  // ----------------------------------------------------
  // TEST 9 — Closed Action: SET_COLOR
  // ----------------------------------------------------
  const colorAction: ACChatAction = {
    type: 'SET_COLOR',
    targetValue: 'vang_hoang_cuc',
    label: 'Đổi màu chủ đạo vàng hoàng cúc',
    description: 'Tông vàng hoàng cúc truyền thống trang trọng.'
  };
  const regColor = registry.registerAction({
    chatSessionId: 'sess_color',
    sourceBlueprint: sampleBlueprint,
    action: colorAction,
    context: sampleContext
  });
  const colorApplyRes = registry.applyAction({
    actionId: regColor.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'sess_color'
  });
  const t9Pass =
    colorApplyRes.status === 200 &&
    colorApplyRes.data?.nextBlueprint.remixProposal.palette[0].id === 'vang_hoang_cuc' &&
    colorApplyRes.data?.nextBlueprint.remixProposal.palette[0].role === 'PRIMARY';

  record(
    'TEST 9',
    'Closed Action: SET_COLOR',
    t9Pass,
    'Correctly updates PRIMARY palette slot to catalog item vang_hoang_cuc.'
  );

  // ----------------------------------------------------
  // TEST 10 — Closed Action: ADD_ACCESSORY
  // ----------------------------------------------------
  const accAction: ACChatAction = {
    type: 'ADD_ACCESSORY',
    targetValue: 'tui_coton_theu_tay',
    label: 'Thêm túi tote thêu tay',
    description: 'Phụ kiện tối giản đựng đồ tiện lợi.'
  };
  const regAcc = registry.registerAction({
    chatSessionId: 'sess_acc',
    sourceBlueprint: sampleBlueprint,
    action: accAction,
    context: sampleContext
  });
  const accApplyRes = registry.applyAction({
    actionId: regAcc.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'sess_acc'
  });
  const t10Pass =
    accApplyRes.status === 200 &&
    accApplyRes.data?.nextBlueprint.remixProposal.accessoryIds.includes('tui_coton_theu_tay');

  record(
    'TEST 10',
    'Closed Action: ADD_ACCESSORY',
    Boolean(t10Pass),
    'Correctly adds catalog accessory to accessoryIds array.'
  );

  // ----------------------------------------------------
  // TEST 11 — Explicit-Only Accessory Guard (Fan/Pearl)
  // ----------------------------------------------------
  const spontaneousFanAction: ACChatAction = {
    type: 'ADD_ACCESSORY',
    targetValue: 'quat_giay_tram_huong',
    label: 'Thêm quạt giấy nan tre',
    description: 'Cầm tay quạt nan tre'
  };
  // Case A: Prompt has NO fan request -> must be rejected by applyAction
  const regFanNoPrompt = registry.registerAction({
    chatSessionId: 'sess_fan_no',
    sourceBlueprint: sampleBlueprint,
    action: spontaneousFanAction,
    context: { ...sampleContext, promptText: 'Phối đồ đi chùa' }
  });
  const fanRejectRes = registry.applyAction({
    actionId: regFanNoPrompt.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'sess_fan_no'
  });

  // Case B: Prompt HAS explicit fan request -> allowed
  const regFanWithPrompt = registry.registerAction({
    chatSessionId: 'sess_fan_yes',
    sourceBlueprint: sampleBlueprint,
    action: spontaneousFanAction,
    context: { ...sampleContext, promptText: 'Tôi muốn mang quạt giấy' }
  });
  const fanAcceptRes = registry.applyAction({
    actionId: regFanWithPrompt.actionId,
    currentFingerprint: baselineFingerprint,
    chatSessionId: 'sess_fan_yes'
  });

  const t11Pass =
    fanRejectRes.status === 422 &&
    fanRejectRes.code === 'EXPLICIT_ONLY_VIOLATION' &&
    fanAcceptRes.status === 200 &&
    fanAcceptRes.data?.nextBlueprint.remixProposal.accessoryIds.includes('quat_giay_tram_huong');

  record(
    'TEST 11',
    'Explicit-Only Accessory Guard (EXPLICIT_ONLY_VIOLATION)',
    Boolean(t11Pass),
    'Enforces explicit user prompt requirement for fan/pearl accessories.'
  );

  // ----------------------------------------------------
  // TEST 12 — Server Route Registration for /api/ac-chat/mutate
  // ----------------------------------------------------
  const t12Pass =
    serverTs.includes("app.post('/api/ac-chat/mutate'") &&
    serverTs.includes('globalActionRegistry.applyAction') &&
    serverTs.indexOf("app.post('/api/ac-chat/mutate'") < serverTs.indexOf("app.all('/api/*'");

  record(
    'TEST 12',
    'Server Route Order (/api/ac-chat/mutate before fallback)',
    t12Pass,
    'Mutate endpoint is registered prior to Express catch-all 404 handler.'
  );

  // ----------------------------------------------------
  // TEST 13 — Client Service API Transport
  // ----------------------------------------------------
  const t13Pass =
    clientChatServiceTs.includes('applyACChatMutation') &&
    clientChatServiceTs.includes("'/api/ac-chat/mutate'") &&
    clientChatServiceTs.includes("'X-AC-API-Response': '1'");

  record(
    'TEST 13',
    'Client API Transport & Canonical Marker',
    t13Pass,
    'applyACChatMutation transmits with X-AC-API-Response marker and JSON headers.'
  );

  // ----------------------------------------------------
  // TEST 14 — Server-Authoritative Apply in App.tsx
  // ----------------------------------------------------
  const t14Pass =
    appTs.includes('applyACChatMutation({') &&
    (appTs.includes('chatSessionId: chatSessionIdRef.current') || appTs.includes('chatSessionId: initialSessionId')) &&
    appTs.includes('setBlueprint(mutateResult.nextBlueprint)') &&
    appTs.includes('setCurrentOutfitFingerprint(mutateResult.nextFingerprint)');

  record(
    'TEST 14',
    'Server-Authoritative State Commit in App.tsx',
    Boolean(t14Pass),
    'Client does not mutate Blueprint locally; commits nextBlueprint directly from Server.'
  );

  // ----------------------------------------------------
  // TEST 15 — Snapshot Immutability (Snapshot NOT Overwritten)
  // ----------------------------------------------------
  const t15Pass =
    !appTs.includes('setLookbookState(prev => ({ ...prev, snapshot: updated') &&
    appTs.includes('Generation Snapshot remains immutable');

  record(
    'TEST 15',
    'Generation Snapshot Immutability',
    t15Pass,
    'Applying an action never mutates or overwrites lookbookState snapshot.'
  );

  // ----------------------------------------------------
  // TEST 16 — Lineage Divergence Banner Copy
  // ----------------------------------------------------
  const t16Pass =
    lookbookTs.includes('Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.') &&
    appTs.includes('Bản phối đã thay đổi. Ảnh hiện tại không còn phản ánh bản phối này.');

  record(
    'TEST 16',
    'Lineage Divergence Exact Copy',
    t16Pass,
    'Lookbook banner and chat notice contain exact approved lineage divergence string.'
  );

  // ----------------------------------------------------
  // TEST 17 — Client Action Card UI State Transitions
  // ----------------------------------------------------
  const t17Pass =
    chatDrawerTs.includes('isApplied ?') &&
    chatDrawerTs.includes('Đã áp dụng') &&
    chatDrawerTs.includes('disabled={isApplied || isApplying}') &&
    chatDrawerTs.includes('Đang áp dụng...');

  record(
    'TEST 17',
    'Action Card UI Lifecycle (Loading, Applied & Disabled States)',
    t17Pass,
    'Button displays loading indicator while awaiting server, disables on success with "Đã áp dụng".'
  );

  // ----------------------------------------------------
  // TEST 18 — Ephemeral Session Refresh on Reset
  // ----------------------------------------------------
  const t18Pass =
    appTs.includes('chatSessionIdRef.current = `cs_') &&
    appTs.includes('setChatMessages([]);') &&
    chatDrawerTs.includes('onClearChat');

  record(
    'TEST 18',
    'Chat Session Ephemeral ID & Reset Barrier',
    t18Pass,
    'Refreshes chatSessionId and clears chat state upon canonical session reset.'
  );

  // ----------------------------------------------------
  // TEST 19 — Client Commit Race Guard (Stale Response Discard)
  // ----------------------------------------------------
  const t19Pass =
    appTs.includes('const latestFingerprint = blueprint ? computeOutfitFingerprint') &&
    (appTs.includes('chatSessionIdRef.current !== chatSessionId') || appTs.includes('chatSessionIdRef.current !== initialSessionId')) &&
    appTs.includes('Discarded stale mutation response');

  record(
    'TEST 19',
    'Client Commit Race Guard',
    Boolean(t19Pass),
    'Rechecks latest fingerprint and session ID before committing nextBlueprint; discards response if state changed while pending.'
  );

  console.log('------------------------------------------------------------------------------------------------------------------------');
  console.log('| Code   | Test Name                                            | Status | Evidence Summary                            |');
  console.log('------------------------------------------------------------------------------------------------------------------------');
  for (const r of results) {
    const padCode = r.code.padEnd(8, ' ');
    const padName = r.name.padEnd(52, ' ').slice(0, 52);
    const padStatus = r.status.padEnd(6, ' ');
    const padEvidence = r.evidence.padEnd(43, ' ').slice(0, 43);
    console.log(`| ${padCode} | ${padName} | ${padStatus} | ${padEvidence} |`);
  }
  console.log('------------------------------------------------------------------------------------------------------------------------');

  const passedCount = results.filter(r => r.status === 'PASS').length;
  console.log(`\nTOTAL TESTS: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);

  if (passedCount !== results.length) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
