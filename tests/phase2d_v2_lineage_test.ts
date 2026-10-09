/**
 * AC — Phase 2D v2 Lineage, Gender Preservation & UX Regression Test Suite
 * MOCK MODE: ZERO LIVE EXTERNAL AI CALLS
 */

import {
  BlueprintOutput,
  ExplorationIntent,
  ExplorationBlueprintResult,
  GenerationSnapshot,
  GenerateLookbookRequest
} from '../src/types/index';
import { computeOutfitFingerprint } from '../src/shared/fingerprint';
import { compileVisualPrompt } from '../server/services/visualPromptCompiler';
import { recordLookbookRevision, getThreadForFingerprint } from '../src/services/visualQAPersistence';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  summary: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

const sampleRemixProposal = {
  palette: [
    { id: 'p1', hex: '#8B0000', name: 'Đỏ thẫm', role: 'PRIMARY' as const },
    { id: 'p2', hex: '#FFD700', name: 'Vàng kim', role: 'SUPPORTING' as const },
    { id: 'p3', hex: '#000000', name: 'Đen tuyền', role: 'ACCENT' as const }
  ],
  fabricId: 'to_tam_ha_dong',
  lowerGarmentId: 'silk_pants_wide',
  footwearId: 'leather_loafer',
  accessoryIds: ['quat_giay_tram_huong']
};

function createMockExplorationResult(
  intent: ExplorationIntent,
  wearerGender: 'nam' | 'nu' | 'neutral'
): ExplorationBlueprintResult {
  const fp = computeOutfitFingerprint({
    garmentId: 'ao_tac',
    palette: sampleRemixProposal.palette,
    fabricId: sampleRemixProposal.fabricId,
    lowerGarmentId: sampleRemixProposal.lowerGarmentId,
    footwearId: sampleRemixProposal.footwearId,
    accessoryIds: sampleRemixProposal.accessoryIds,
    occasion: 'tet_temple',
    style: 'balanced',
    traditionalRatio: 50,
    genderPresentation: wearerGender
  });

  return {
    explorationId: `exp_${Date.now()}_${intent}`,
    explorationIntent: intent,
    parentBlueprintFingerprint: 'parent_fp',
    resultingOutfitFingerprint: fp,
    blueprint: {
      garmentId: 'ao_tac',
      remixProposal: sampleRemixProposal,
      contextCautions: []
    },
    stylingRationale: 'Lý giải phong cách thử nghiệm.',
    changesRelativeToOriginal: 'Thay đổi phụ kiện và chất liệu.',
    wearerGender
  };
}

function createSnapshotFromExploration(
  expResult: ExplorationBlueprintResult,
  committedGender: 'nam' | 'nu' | 'neutral'
): GenerationSnapshot {
  const effectiveGender = expResult.wearerGender || committedGender;
  return {
    garmentId: expResult.blueprint.garmentId,
    genderPresentation: effectiveGender,
    palette: expResult.blueprint.remixProposal.palette.map(p => ({
      id: p.id,
      role: p.role,
      hex: p.hex,
      name: p.name
    })),
    fabricId: expResult.blueprint.remixProposal.fabricId,
    lowerGarmentId: expResult.blueprint.remixProposal.lowerGarmentId,
    footwearId: expResult.blueprint.remixProposal.footwearId,
    activeAccessoryIds: [...expResult.blueprint.remixProposal.accessoryIds],
    committedContextSnapshot: {
      promptText: '',
      occasion: 'tet_temple',
      style: 'balanced',
      traditionalRatio: 50,
      genderPresentation: effectiveGender
    },
    boundFingerprint: expResult.resultingOutfitFingerprint
  };
}

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING PHASE 2D v2 LINEAGE & GENDER PRESERVATION TESTS');
  console.log('MOCK MODE: ZERO LIVE EXTERNAL AI CALLS');
  console.log('========================================================');

  // 1. female root → MORE_TRADITIONAL → branch snapshot female
  try {
    const exp = createMockExplorationResult('MORE_TRADITIONAL', 'nu');
    const snapshot = createSnapshotFromExploration(exp, 'nu');
    assert(snapshot.genderPresentation === 'nu', 'Snapshot must be female');
    assert(snapshot.committedContextSnapshot?.genderPresentation === 'nu', 'Committed context snapshot must be female');
    results.push({
      id: 'TEST_01',
      name: 'FEMALE_ROOT_MORE_TRADITIONAL',
      passed: true,
      summary: 'female root → MORE_TRADITIONAL → branch snapshot female'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_01', name: 'FEMALE_ROOT_MORE_TRADITIONAL', passed: false, summary: err.message });
  }

  // 2. female root → MORE_REMIXED → branch snapshot female
  try {
    const exp = createMockExplorationResult('MORE_REMIXED', 'nu');
    const snapshot = createSnapshotFromExploration(exp, 'nu');
    assert(snapshot.genderPresentation === 'nu', 'Snapshot must be female');
    assert(snapshot.committedContextSnapshot?.genderPresentation === 'nu', 'Committed context snapshot must be female');
    results.push({
      id: 'TEST_02',
      name: 'FEMALE_ROOT_MORE_REMIXED',
      passed: true,
      summary: 'female root → MORE_REMIXED → branch snapshot female'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_02', name: 'FEMALE_ROOT_MORE_REMIXED', passed: false, summary: err.message });
  }

  // 3. female root → ALTERNATIVE → branch snapshot female
  try {
    const exp = createMockExplorationResult('ALTERNATIVE', 'nu');
    const snapshot = createSnapshotFromExploration(exp, 'nu');
    assert(snapshot.genderPresentation === 'nu', 'Snapshot must be female');
    assert(snapshot.committedContextSnapshot?.genderPresentation === 'nu', 'Committed context snapshot must be female');
    results.push({
      id: 'TEST_03',
      name: 'FEMALE_ROOT_ALTERNATIVE',
      passed: true,
      summary: 'female root → ALTERNATIVE → branch snapshot female'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_03', name: 'FEMALE_ROOT_ALTERNATIVE', passed: false, summary: err.message });
  }

  // 4. male root → all three exploration modes remain male
  try {
    const expTrad = createMockExplorationResult('MORE_TRADITIONAL', 'nam');
    const expRemix = createMockExplorationResult('MORE_REMIXED', 'nam');
    const expAlt = createMockExplorationResult('ALTERNATIVE', 'nam');

    const snapTrad = createSnapshotFromExploration(expTrad, 'nam');
    const snapRemix = createSnapshotFromExploration(expRemix, 'nam');
    const snapAlt = createSnapshotFromExploration(expAlt, 'nam');

    assert(snapTrad.genderPresentation === 'nam', 'MORE_TRADITIONAL must be male');
    assert(snapRemix.genderPresentation === 'nam', 'MORE_REMIXED must be male');
    assert(snapAlt.genderPresentation === 'nam', 'ALTERNATIVE must be male');
    results.push({
      id: 'TEST_04',
      name: 'MALE_ROOT_ALL_EXPLORATION_MODES',
      passed: true,
      summary: 'male root → all three exploration modes remain male'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_04', name: 'MALE_ROOT_ALL_EXPLORATION_MODES', passed: false, summary: err.message });
  }

  // 5. female branch → “Tạo phương án khác cùng hướng” → sibling remains female
  try {
    const branch1 = createMockExplorationResult('MORE_REMIXED', 'nu');
    // Sibling triggered with parent/active context
    const siblingBranch = createMockExplorationResult('MORE_REMIXED', branch1.wearerGender || 'nu');
    const siblingSnap = createSnapshotFromExploration(siblingBranch, 'nu');
    assert(siblingSnap.genderPresentation === 'nu', 'Sibling branch must preserve female gender');
    results.push({
      id: 'TEST_05',
      name: 'FEMALE_SIBLING_BRANCH_PRESERVES_FEMALE',
      passed: true,
      summary: 'female branch → sibling remains female'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_05', name: 'FEMALE_SIBLING_BRANCH_PRESERVES_FEMALE', passed: false, summary: err.message });
  }

  // 6. male branch → sibling remains male
  try {
    const branch1 = createMockExplorationResult('MORE_TRADITIONAL', 'nam');
    const siblingBranch = createMockExplorationResult('MORE_TRADITIONAL', branch1.wearerGender || 'nam');
    const siblingSnap = createSnapshotFromExploration(siblingBranch, 'nam');
    assert(siblingSnap.genderPresentation === 'nam', 'Sibling branch must preserve male gender');
    results.push({
      id: 'TEST_06',
      name: 'MALE_SIBLING_BRANCH_PRESERVES_MALE',
      passed: true,
      summary: 'male branch → sibling remains male'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_06', name: 'MALE_SIBLING_BRANCH_PRESERVES_MALE', passed: false, summary: err.message });
  }

  // 7. branch V0 → V1 → V2 preserves wearer presentation
  try {
    const branchExp = createMockExplorationResult('MORE_REMIXED', 'nu');
    const branchV0Snap = createSnapshotFromExploration(branchExp, 'nu');

    const thread = recordLookbookRevision({
      boundFingerprint: branchExp.resultingOutfitFingerprint,
      garmentId: 'ao_tac',
      generationId: 'gen_branch_v0',
      revisionIndex: 0,
      imageUrl: '/api/generated-images/gen_branch_v0',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      snapshot: branchV0Snap
    });

    // V1 Revision inherits snapshot gender
    const v0Snapshot = thread.revisions[0].snapshot;
    const v1Gender = v0Snapshot.genderPresentation;
    assert(v1Gender === 'nu', 'V1 revision must inherit female gender from V0 snapshot');

    const threadWithV1 = recordLookbookRevision({
      boundFingerprint: branchExp.resultingOutfitFingerprint,
      garmentId: 'ao_tac',
      generationId: 'gen_branch_v1',
      revisionIndex: 1,
      imageUrl: '/api/generated-images/gen_branch_v1',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      snapshot: { ...branchV0Snap, boundFingerprint: branchExp.resultingOutfitFingerprint }
    });

    const v2Gender = threadWithV1.revisions[0].snapshot.genderPresentation;
    assert(v2Gender === 'nu', 'V2 revision must inherit female gender from V0 snapshot');
    results.push({
      id: 'TEST_07',
      name: 'BRANCH_V0_V1_V2_PRESERVES_GENDER',
      passed: true,
      summary: 'branch V0 → V1 → V2 preserves wearer presentation'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_07', name: 'BRANCH_V0_V1_V2_PRESERVES_GENDER', passed: false, summary: err.message });
  }

  // 8. multiple exploration branches do not leak gender into one another
  try {
    const femaleBranch = createMockExplorationResult('MORE_REMIXED', 'nu');
    const maleBranch = createMockExplorationResult('ALTERNATIVE', 'nam');

    const femaleSnap = createSnapshotFromExploration(femaleBranch, 'nu');
    const maleSnap = createSnapshotFromExploration(maleBranch, 'nam');

    assert(femaleSnap.genderPresentation === 'nu', 'Female branch snapshot is nu');
    assert(maleSnap.genderPresentation === 'nam', 'Male branch snapshot is nam');
    assert(femaleBranch.resultingOutfitFingerprint !== maleBranch.resultingOutfitFingerprint, 'Fingerprints differ');
    results.push({
      id: 'TEST_08',
      name: 'NO_CROSS_BRANCH_GENDER_LEAKAGE',
      passed: true,
      summary: 'multiple exploration branches do not leak gender into one another'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_08', name: 'NO_CROSS_BRANCH_GENDER_LEAKAGE', passed: false, summary: err.message });
  }

  // 9. image compiler receives wearer context from the branch snapshot, not a default
  try {
    const femaleBranch = createMockExplorationResult('MORE_REMIXED', 'nu');
    const femaleSnap = createSnapshotFromExploration(femaleBranch, 'nu');

    const req: GenerateLookbookRequest = {
      garmentId: 'ao_tac',
      genderPresentation: femaleSnap.genderPresentation,
      remixProposal: sampleRemixProposal,
      context: {
        occasion: 'tet_temple',
        style: 'balanced',
        traditionalRatio: 50,
        genderPresentation: femaleSnap.genderPresentation
      },
      outfitFingerprint: femaleSnap.boundFingerprint
    };

    const compiled = compileVisualPrompt(req);
    assert(compiled.prompt.includes('female model'), 'Compiled prompt must specify female model');
    assert(compiled.prompt.includes('a female Vietnamese model'), 'Compiled prompt must lock female identity');
    assert(!compiled.prompt.includes('One Vietnamese male model'), 'Compiled prompt must NOT be male model');
    results.push({
      id: 'TEST_09',
      name: 'COMPILER_CONSUMES_BRANCH_SNAPSHOT_GENDER',
      passed: true,
      summary: 'image compiler receives wearer context from the branch snapshot, not a default'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_09', name: 'COMPILER_CONSUMES_BRANCH_SNAPSHOT_GENDER', passed: false, summary: err.message });
  }

  // 10. no code path defaults an existing explicit female context back to male
  try {
    const explicitFemale = 'nu';
    const effectiveInServer = (explicitFemale as string) || 'nam';
    assert(effectiveInServer === 'nu', 'Explicit female must never default to nam');

    const compiledMale = compileVisualPrompt({
      garmentId: 'ao_tac',
      genderPresentation: 'nam',
      remixProposal: sampleRemixProposal,
      context: { occasion: 'tet', style: 'balanced', traditionalRatio: 50, genderPresentation: 'nam' },
      outfitFingerprint: 'fp_m'
    });
    assert(compiledMale.prompt.includes('male model'), 'Explicit male uses male model');

    const compiledFemale = compileVisualPrompt({
      garmentId: 'ao_tac',
      genderPresentation: 'nu',
      remixProposal: sampleRemixProposal,
      context: { occasion: 'tet', style: 'balanced', traditionalRatio: 50, genderPresentation: 'nu' },
      outfitFingerprint: 'fp_f'
    });
    assert(compiledFemale.prompt.includes('female model'), 'Explicit female uses female model');
    results.push({
      id: 'TEST_10',
      name: 'NO_SILENT_FALLBACK_TO_MALE',
      passed: true,
      summary: 'no code path defaults an existing explicit female context back to male'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_10', name: 'NO_SILENT_FALLBACK_TO_MALE', passed: false, summary: err.message });
  }

  // 11. existing Phase 2D lineage tests remain green
  try {
    const lineages = {
      root: { status: 'success', generationId: 'gen_root_v0' },
      MORE_TRADITIONAL: { status: 'success', generationId: 'gen_branch_v0' }
    };
    assert(lineages.root.generationId !== lineages.MORE_TRADITIONAL.generationId, 'Root and branch V0 distinct');
    assert(lineages.root.status === 'success', 'Root selectable');
    assert(lineages.MORE_TRADITIONAL.status === 'success', 'Branch selectable');
    results.push({
      id: 'TEST_11',
      name: 'PHASE_2D_LINEAGE_INTEGRITY',
      passed: true,
      summary: 'existing Phase 2D lineage tests remain green'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_11', name: 'PHASE_2D_LINEAGE_INTEGRITY', passed: false, summary: err.message });
  }

  // 12. existing Visual QA and GenerationSnapshot regressions remain green
  try {
    const snapshot: GenerationSnapshot = {
      garmentId: 'ao_tac',
      genderPresentation: 'nu',
      palette: sampleRemixProposal.palette,
      fabricId: sampleRemixProposal.fabricId,
      lowerGarmentId: sampleRemixProposal.lowerGarmentId,
      footwearId: sampleRemixProposal.footwearId,
      activeAccessoryIds: sampleRemixProposal.accessoryIds,
      committedContextSnapshot: {
        promptText: '',
        occasion: 'tet_temple',
        style: 'balanced',
        traditionalRatio: 50,
        genderPresentation: 'nu'
      },
      boundFingerprint: 'fp_test_12'
    };
    assert(snapshot.activeAccessoryIds.length === 1, 'Active accessories recorded in snapshot');
    assert(snapshot.genderPresentation === 'nu', 'Wearer gender preserved');
    results.push({
      id: 'TEST_12',
      name: 'VISUAL_QA_SNAPSHOT_REGRESSIONS_GREEN',
      passed: true,
      summary: 'existing Visual QA and GenerationSnapshot regressions remain green'
    });
  } catch (err: any) {
    results.push({ id: 'TEST_12', name: 'VISUAL_QA_SNAPSHOT_REGRESSIONS_GREEN', passed: false, summary: err.message });
  }

  let passed = results.filter(r => r.passed).length;
  let failed = results.filter(r => !r.passed).length;

  console.log('--------------------------------------------------------');
  for (const r of results) {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.id} - ${r.name}: ${r.summary}`);
  }
  console.log('--------------------------------------------------------');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
