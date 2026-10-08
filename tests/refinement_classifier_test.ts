/**
 * AC — Refinement Classifier Unit Test Suite
 *
 * Verifies that user-guided refinement text is accurately classified into:
 * 1. IMAGE_ONLY_ALLOWED (lighting, pose, angle, drape, background, approved props)
 * 2. STRUCTURAL_CONTRADICTION (removing/altering collars, sleeves, lapels, buttons, garment structures)
 * 3. BLUEPRINT_MUTATION_REQUIRED (switching garment, palette, fabric, lower garment, footwear, wearable accessories)
 *
 * Proves that structural contradictions and blueprint mutations are BLOCKED from triggering V1/V2 generation.
 */

import { classifyRefinementInput } from '../src/shared/refinementClassifier';

interface TestItem {
  name: string;
  input: string;
  garmentId?: string;
  expectedCategory: string;
  expectedAllowed: boolean;
}

const testCases: TestItem[] = [
  // 1. IMAGE_ONLY_ALLOWED
  {
    name: 'Lighting and angle refinement',
    input: 'đổi góc chụp hơi nghiêng sang trái và ánh sáng ấm hơn',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'IMAGE_ONLY_ALLOWED',
    expectedAllowed: true
  },
  {
    name: 'Pose and expression refinement',
    input: 'dáng đứng tự nhiên hơn, mỉm cười nhẹ và nhìn thẳng',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'IMAGE_ONLY_ALLOWED',
    expectedAllowed: true
  },
  {
    name: 'Fabric drape refinement',
    input: 'tùy chỉnh độ rủ vải mềm mại tự nhiên',
    garmentId: 'ao_tac',
    expectedCategory: 'IMAGE_ONLY_ALLOWED',
    expectedAllowed: true
  },

  // 2. STRUCTURAL_CONTRADICTION
  {
    name: 'Collar removal ("xóa cổ áo đi")',
    input: 'xóa cổ áo đi',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'STRUCTURAL_CONTRADICTION',
    expectedAllowed: false
  },
  {
    name: 'Standing collar removal ("bỏ cổ lập lĩnh")',
    input: 'bỏ cổ lập lĩnh không cần cổ đứng',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'STRUCTURAL_CONTRADICTION',
    expectedAllowed: false
  },
  {
    name: 'Sleeve mutation on ngu_than_chen ("đổi tay chẽn thành tay thụng")',
    input: 'đổi tay chẽn thành tay thụng rộng',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'STRUCTURAL_CONTRADICTION',
    expectedAllowed: false
  },
  {
    name: 'Sleeve mutation on ao_tac ("bóp hẹp ống tay thành tay chẽn")',
    input: 'thu hẹp ống tay thành tay chẽn',
    garmentId: 'ao_tac',
    expectedCategory: 'STRUCTURAL_CONTRADICTION',
    expectedAllowed: false
  },
  {
    name: 'Tail/panel removal ("bỏ tà áo đi")',
    input: 'bỏ tà áo đi may vạt ngắn',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'STRUCTURAL_CONTRADICTION',
    expectedAllowed: false
  },
  {
    name: 'Button/closure removal ("xóa cúc cài")',
    input: 'bỏ khuy cài nách phải',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'STRUCTURAL_CONTRADICTION',
    expectedAllowed: false
  },

  // 3. BLUEPRINT_MUTATION_REQUIRED
  {
    name: 'Garment switching ("chuyển sang áo tấc")',
    input: 'chuyển sang áo tấc',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'BLUEPRINT_MUTATION_REQUIRED',
    expectedAllowed: false
  },
  {
    name: 'Color palette change ("đổi màu áo sang màu đỏ")',
    input: 'đổi màu áo sang màu đỏ rực',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'BLUEPRINT_MUTATION_REQUIRED',
    expectedAllowed: false
  },
  {
    name: 'Fabric change ("thay chất liệu gấm")',
    input: 'thay chất liệu lụa tơ tằm sang gấm',
    garmentId: 'ngu_than_chen',
    expectedCategory: 'BLUEPRINT_MUTATION_REQUIRED',
    expectedAllowed: false
  },
  {
    name: 'Lower garment change ("đổi quần sang váy")',
    input: 'đổi quần lụa sang váy xếp li',
    garmentId: 'ao_tu_than',
    expectedCategory: 'BLUEPRINT_MUTATION_REQUIRED',
    expectedAllowed: false
  }
];

function runTests() {
  console.log('================================================================');
  console.log('RUNNING REFINEMENT CLASSIFIER TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const result = classifyRefinementInput(tc.input, tc.garmentId);
    const categoryMatch = result.category === tc.expectedCategory;
    const allowedMatch = result.allowed === tc.expectedAllowed;

    if (categoryMatch && allowedMatch) {
      console.log(`[PASS] ${tc.name}`);
      console.log(`       Input: "${tc.input}"`);
      console.log(`       Result: category=${result.category}, allowed=${result.allowed}`);
      passed++;
    } else {
      console.error(`[FAIL] ${tc.name}`);
      console.error(`       Input: "${tc.input}"`);
      console.error(`       Expected: category=${tc.expectedCategory}, allowed=${tc.expectedAllowed}`);
      console.error(`       Actual:   category=${result.category}, allowed=${result.allowed}`);
      console.error(`       Reason:   ${result.reason}`);
      failed++;
    }
    console.log('----------------------------------------------------------------');
  }

  console.log(`\nTOTAL: ${testCases.length} | PASSED: ${passed} | FAILED: ${failed}`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
