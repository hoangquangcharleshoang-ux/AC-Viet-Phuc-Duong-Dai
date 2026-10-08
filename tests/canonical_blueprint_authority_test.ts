/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Refined Blueprint Authority & Contextual Prop Separation Test Suite
 */

import { compileVisualPrompt } from '../server/services/visualPromptCompiler';
import { extractContextPropsFromPrompt } from '../server/services/culturalPolicyService';
import { computeOutfitFingerprint } from '../src/shared/fingerprint';
import { aggregateCulturalVisualQA, buildGroundedCorrectionPlan } from '../server/services/visualQAAggregator';
import { GenerateLookbookRequest, ContextProp, RawOutfitFidelityEvidence, GenerationSnapshot } from '../src/types/index';

function runCanonicalBlueprintAuthorityTests() {
  console.log('================================================================');
  console.log('RUNNING REFINED BLUEPRINT AUTHORITY & CONTEXT PROP TEST SUITE');
  console.log('================================================================\n');

  let total = 0;
  let passed = 0;

  function assert(testCode: string, testName: string, condition: boolean, details: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`| ${testCode.padEnd(8)} | ${testName.padEnd(52)} | PASS   | ${details}`);
    } else {
      console.error(`| ${testCode.padEnd(8)} | ${testName.padEnd(52)} | FAIL   | ${details}`);
    }
  }

  // TEST A: Rejected wearable accessory does not leak
  // User asked for an unapproved/rejected accessory; accessoryIds = []; contextProps = []
  const reqA: GenerateLookbookRequest = {
    garmentId: 'ngu_than_chen',
    genderPresentation: 'nam',
    remixProposal: {
      palette: [
        { id: 'do_son', hex: '#C2185B', name: 'Đỏ sơn', role: 'PRIMARY' },
        { id: 'trang_nga', hex: '#F5F5F0', name: 'Trắng ngà', role: 'SUPPORTING' },
        { id: 'vang_dong', hex: '#FFD54F', name: 'Vàng đồng', role: 'ACCENT' }
      ],
      fabricId: 'to_tam_ha_dong',
      lowerGarmentId: 'tailored_trousers_straight',
      footwearId: 'leather_loafer',
      accessoryIds: [],
      contextProps: []
    },
    context: {
      occasion: 'tet',
      style: 'tre_trung',
      traditionalRatio: 50,
      userStyleIntent: undefined,
      genderPresentation: 'nam'
    },
    outfitFingerprint: 'fp_test_a'
  };

  const compiledA = compileVisualPrompt(reqA);
  const promptA = compiledA.prompt;

  const testAPass =
    !promptA.toLowerCase().includes('coca') &&
    !promptA.toLowerCase().includes('cola') &&
    promptA.includes('No wearable fashion accessories') &&
    promptA.includes('The model holds no objects in hand');

  assert(
    'TEST A',
    'Rejected Wearable Accessory Protection',
    testAPass,
    'V0 prompt strictly excludes rejected accessories and confirms clean minimalism when no props exist.'
  );

  // TEST B: Explicit contextual prop allowed
  // User requested "cần phụ kiện là lon coca cola tết".
  // Extracted as contextProps = [{ type: 'handheld', description: 'lon Coca-Cola phiên bản Tết', ... }]
  // accessoryIds remains empty [].
  const extractedPropsB = extractContextPropsFromPrompt('cần phụ kiện là lon coca cola tết', 'tet');
  const reqB: GenerateLookbookRequest = {
    ...reqA,
    remixProposal: {
      ...reqA.remixProposal,
      accessoryIds: [], // Wearable accessories remains EMPTY
      contextProps: extractedPropsB
    },
    outfitFingerprint: 'fp_test_b'
  };

  const compiledB = compileVisualPrompt(reqB);
  const promptB = compiledB.prompt;

  const testBPass =
    promptB.includes('lon Coca-Cola phiên bản Tết') &&
    reqB.remixProposal.accessoryIds.length === 0 &&
    promptB.includes('The primary garment is an authentic Áo ngũ thân tay chẽn') &&
    promptB.includes('No wearable fashion accessories');

  assert(
    'TEST B',
    'Explicit Contextual Prop Allowed (Coca-Cola Tet Can)',
    testBPass,
    'Coca-Cola Tet can is rendered as a handheld contextual prop while wearable accessories remain empty and garment locks remain intact.'
  );

  // TEST C: No invention when no accessory and no prop approved
  const reqC: GenerateLookbookRequest = {
    ...reqA,
    remixProposal: {
      ...reqA.remixProposal,
      accessoryIds: [],
      contextProps: []
    },
    outfitFingerprint: 'fp_test_c'
  };

  const compiledC = compileVisualPrompt(reqC);
  const promptC = compiledC.prompt;

  const testCPass =
    promptC.includes('The model holds no objects in hand') &&
    promptC.includes('No handheld props or environmental scene items are present') &&
    !promptC.includes('lon Coca-Cola');

  assert(
    'TEST C',
    'No Invention Guard (Empty Props)',
    testCPass,
    'Prompt strictly forbids inventing handheld objects or scene props when none are approved.'
  );

  // TEST D: Contemporary prop is not historical evidence
  // Verify that extractContextPropsFromPrompt assigns source = explicit_user_request & contextFit = context_sensitive
  const propD = extractedPropsB[0];
  const testDPass =
    Boolean(propD) &&
    propD.description === 'lon Coca-Cola phiên bản Tết' &&
    propD.source === 'explicit_user_request' &&
    propD.contextFit === 'context_sensitive';

  assert(
    'TEST D',
    'Contemporary Prop Cultural Classification',
    testDPass,
    'Contemporary prop is correctly classified as a context_sensitive user request rather than historical evidence.'
  );

  // TEST E: Revision preserves separation
  // Lighting-only V1/V2 retains the approved prop without converting it into outfit accessory
  const reqE: GenerateLookbookRequest = {
    ...reqB,
    revisionIndex: 1,
    context: {
      ...reqB.context,
      userStyleIntent: '[Tinh chỉnh theo ý tôi: làm sáng góc chiếu]'
    },
    outfitFingerprint: 'fp_test_e'
  };

  const compiledE = compileVisualPrompt(reqE);
  const promptE = compiledE.prompt;

  const testEPass =
    promptE.includes('lon Coca-Cola phiên bản Tết') &&
    reqE.remixProposal.accessoryIds.length === 0 &&
    promptE.includes('làm sáng góc chiếu');

  assert(
    'TEST E',
    'Revision Preserves Prop/Accessory Separation',
    testEPass,
    'V1 revision retains approved contextual prop without converting it into a wearable accessory.'
  );

  // TEST F: Fingerprint Parity Across Client & Server with contextProps
  const clientFpInput = {
    garmentId: 'ngu_than_chen',
    palette: reqB.remixProposal.palette,
    fabricId: reqB.remixProposal.fabricId,
    lowerGarmentId: reqB.remixProposal.lowerGarmentId,
    footwearId: reqB.remixProposal.footwearId,
    accessoryIds: [],
    contextProps: [
      {
        type: 'handheld' as const,
        description: 'Lon Coca-Cola phiên bản Tết',
        source: 'explicit_user_request' as const,
        contextFit: 'context_sensitive' as const
      }
    ],
    occasion: 'tet',
    style: 'tre_trung',
    traditionalRatio: 50,
    genderPresentation: 'nam'
  };

  const serverFpInput = {
    garmentId: 'ngu_than_chen',
    palette: reqB.remixProposal.palette,
    fabricId: reqB.remixProposal.fabricId,
    lowerGarmentId: reqB.remixProposal.lowerGarmentId,
    footwearId: reqB.remixProposal.footwearId,
    accessoryIds: [],
    contextProps: [
      {
        contextFit: 'context_sensitive' as const,
        source: 'explicit_user_request' as const,
        description: 'lon coca-cola phiên bản tết  ',
        type: 'handheld' as const
      }
    ],
    occasion: 'tet',
    style: 'tre_trung',
    traditionalRatio: 50,
    genderPresentation: 'nam'
  };

  const fpClient = computeOutfitFingerprint(clientFpInput);
  const fpServer = computeOutfitFingerprint(serverFpInput);

  const testFPass =
    Boolean(fpClient) &&
    fpClient === fpServer;

  assert(
    'TEST F',
    'Client/Server Fingerprint Parity with ContextProps',
    testFPass,
    `Client FP (${fpClient}) equals Server FP (${fpServer}) despite casing/property-order differences.`
  );

  // TEST G: QA Canonical Prop Recognition & Server Guard
  // Vision raw result includes "Lon nước ngọt Coca-Cola" as unexpected, but contextProps has "lon Coca-Cola phiên bản Tết"
  const rawFidelityG: RawOutfitFidelityEvidence = {
    palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
    fabricMatch: 'PASS',
    lowerGarmentMatch: 'PASS',
    footwearMatch: 'PASS',
    expectedAccessories: [],
    unexpectedAccessories: ['Lon nước ngọt Coca-Cola']
  };

  const contextPropsG: ContextProp[] = [
    {
      type: 'handheld',
      description: 'lon Coca-Cola phiên bản Tết',
      source: 'explicit_user_request',
      contextFit: 'context_sensitive'
    }
  ];

  const qaOutputG = aggregateCulturalVisualQA('ngu_than_chen', [], rawFidelityG, 'gen_g', 'fp_g', contextPropsG);
  const snapG: GenerationSnapshot = {
    boundFingerprint: 'fp_g',
    garmentId: 'ngu_than_chen',
    palette: reqB.remixProposal.palette,
    fabricId: reqB.remixProposal.fabricId,
    lowerGarmentId: reqB.remixProposal.lowerGarmentId,
    footwearId: reqB.remixProposal.footwearId,
    activeAccessoryIds: [],
    contextProps: contextPropsG
  };

  const planG = buildGroundedCorrectionPlan('ngu_than_chen', qaOutputG, snapG);

  const testGPass =
    qaOutputG.outfitFidelity.details.unexpectedAccessories.length === 0 &&
    !planG.fidelityDeltas.some(f => f.description.includes('Coca-Cola')) &&
    planG.preservationConstraints.some(c => c.includes('Bảo toàn các đạo cụ bối cảnh đã phê duyệt'));

  assert(
    'TEST G',
    'QA Canonical Prop Recognition & Server Authority Guard',
    testGPass,
    'Server filters out approved Coca-Cola prop from unexpected accessories and generates no remove action.'
  );

  // TEST H: V0 -> V1 -> V2 Automatic Prop Preservation Across Image-Only Refinements
  const reqV0: GenerateLookbookRequest = {
    ...reqB,
    revisionIndex: 0
  };
  const compiledV0 = compileVisualPrompt(reqV0);

  // V1 request with lighting refinement only
  const reqV1: GenerateLookbookRequest = {
    ...reqB,
    revisionIndex: 1,
    groundedCorrectionPlan: planG,
    context: {
      ...reqB.context,
      userStyleIntent: '[Tinh chỉnh theo ý tôi: Đổi góc chụp hơi nghiêng sang trái và ánh sáng ấm hơn]'
    }
  };
  const compiledV1 = compileVisualPrompt(reqV1);

  // V2 request with pose refinement only
  const reqV2: GenerateLookbookRequest = {
    ...reqB,
    revisionIndex: 2,
    groundedCorrectionPlan: planG,
    context: {
      ...reqB.context,
      userStyleIntent: '[Tinh chỉnh theo ý tôi: Đổi dáng đứng tự nhiên hơn]'
    }
  };
  const compiledV2 = compileVisualPrompt(reqV2);

  const testHPass =
    compiledV0.prompt.includes('lon Coca-Cola phiên bản Tết') &&
    compiledV1.prompt.includes('lon Coca-Cola phiên bản Tết') &&
    compiledV2.prompt.includes('lon Coca-Cola phiên bản Tết') &&
    compiledV1.prompt.includes('Bảo toàn các đạo cụ bối cảnh đã phê duyệt') &&
    compiledV2.prompt.includes('Bảo toàn các đạo cụ bối cảnh đã phê duyệt');

  assert(
    'TEST H',
    'V0 -> V1 -> V2 Automatic ContextProp Preservation',
    testHPass,
    'V0, V1, and V2 compiled prompts automatically preserve the approved Coca-Cola prop in image-only refinements.'
  );

  // TEST I: Unapproved Invented Object Flagged
  const rawFidelityI: RawOutfitFidelityEvidence = {
    palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
    fabricMatch: 'PASS',
    lowerGarmentMatch: 'PASS',
    footwearMatch: 'PASS',
    expectedAccessories: [],
    unexpectedAccessories: ['Dù hoa đăng']
  };

  const qaOutputI = aggregateCulturalVisualQA('ngu_than_chen', [], rawFidelityI, 'gen_i', 'fp_i', []);
  const snapI: GenerationSnapshot = {
    boundFingerprint: 'fp_i',
    garmentId: 'ngu_than_chen',
    palette: reqA.remixProposal.palette,
    fabricId: reqA.remixProposal.fabricId,
    lowerGarmentId: reqA.remixProposal.lowerGarmentId,
    footwearId: reqA.remixProposal.footwearId,
    activeAccessoryIds: [],
    contextProps: []
  };
  const planI = buildGroundedCorrectionPlan('ngu_than_chen', qaOutputI, snapI);

  const testIPass =
    qaOutputI.outfitFidelity.details.unexpectedAccessories.includes('Dù hoa đăng') &&
    planI.fidelityDeltas.some(f => f.description.includes('Dù hoa đăng'));

  assert(
    'TEST I',
    'Unapproved Invented Object Correctly Flagged',
    testIPass,
    'Unapproved object ("Dù hoa đăng") absent from both accessoryIds and contextProps is correctly flagged by QA.'
  );

  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${total - passed}`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runCanonicalBlueprintAuthorityTests();
