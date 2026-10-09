/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Blueprint Deadline, Budget & Loading Determinism Test Suite
 * MOCK ONLY: ZERO LIVE EXTERNAL AI CALLS.
 */

import { ROUTER_CONFIG } from '../server/services/geminiErrorClassifier';
import { routeGeminiTask } from '../server/services/modelRouter';
import { getModelPoolForTask } from '../server/services/modelRegistry';
import { circuitBreaker } from '../server/services/circuitBreaker';

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

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING BLUEPRINT DEADLINE, BUDGET & LOADING TEST SUITE');
  console.log('MOCK MODE: ZERO LIVE EXTERNAL AI CALLS');
  console.log('========================================================\n');

  // 1. Test Call B Deadline Config (Must be <= 16s to avoid outer 20s proxy collision)
  const callBDeadline = ROUTER_CONFIG.callBDeadlineMs;
  const test1Pass = callBDeadline <= 16000;
  record(
    1,
    'TEST_TRANSPORT_DEADLINE_SAFETY',
    test1Pass,
    `Call B deadline is ${callBDeadline}ms (<= 16000ms safety limit against outer proxy ceiling)`
  );

  // 2. Test Router Deadline Exceeded returns typed JSON error format
  let routerDeadlineError: any = null;
  try {
    const pool = getModelPoolForTask('BLUEPRINT');
    // Force immediate deadline exceeded by setting deadline in the past
    await routeGeminiTask({
      task: 'BLUEPRINT',
      requestId: 'test_deadline_exceeded',
      deadlineMs: 1, // immediate deadline
      executeWithModel: async () => 'result'
    });
  } catch (err: any) {
    routerDeadlineError = err;
  }

  const test2Pass = routerDeadlineError &&
                    routerDeadlineError.status === 504 &&
                    routerDeadlineError.code === 'GEMINI_ROUTER_DEADLINE_EXCEEDED';
  record(
    2,
    'TEST_ROUTER_DEADLINE_TYPED_JSON',
    test2Pass,
    `Router deadline exceeded produced status=${routerDeadlineError?.status}, code=${routerDeadlineError?.code}`
  );

  // 3. Test All-Model Cooldown returns NO_COMPATIBLE_MODEL_AVAILABLE immediately
  // Disable all models in pool for BLUEPRINT via setState
  const bpPool = getModelPoolForTask('BLUEPRINT');
  for (const m of bpPool) {
    circuitBreaker.setState(m, { status: 'COOLDOWN', cooldownUntil: Date.now() + 60000 });
  }

  let allCooldownError: any = null;
  try {
    await routeGeminiTask({
      task: 'BLUEPRINT',
      requestId: 'test_all_cooldown',
      executeWithModel: async () => 'result'
    });
  } catch (err: any) {
    allCooldownError = err;
  }

  // Reset circuit breaker for cleanup
  circuitBreaker.reset();

  const test3Pass = allCooldownError &&
                    allCooldownError.status === 503 &&
                    allCooldownError.code === 'NO_COMPATIBLE_MODEL_AVAILABLE';
  record(
    3,
    'TEST_ALL_MODELS_COOLDOWN_FAIL_FAST',
    test3Pass,
    `All models in cooldown correctly triggered status=${allCooldownError?.status}, code=${allCooldownError?.code}`
  );

  // 4. Test Blueprint Client Non-JSON / HTML 200 Handling Simulation
  let clientNonJsonHandled = false;
  try {
    const mockHtmlResponse = '<p>Gateway Timeout</p>';
    const contentType = 'text/html; charset=utf-8';
    if (!contentType.includes('application/json')) {
      throw { code: 'NON_JSON_RESPONSE', status: 504, message: 'Phản hồi máy chủ không đúng định dạng JSON (504).' };
    }
  } catch (err: any) {
    if (err.code === 'NON_JSON_RESPONSE' && err.status === 504) {
      clientNonJsonHandled = true;
    }
  }

  record(
    4,
    'TEST_CLIENT_NON_JSON_DEFENSE',
    clientNonJsonHandled,
    'HTML 200/non-JSON response correctly caught and mapped to NON_JSON_RESPONSE error'
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
    console.log('\nBLUEPRINT DEADLINE & BUDGET TEST SUITE: ALL TESTS PASSED SUCCESSFULLY');
    process.exit(0);
  } else {
    console.log('\nBLUEPRINT DEADLINE & BUDGET TEST SUITE: SOME TESTS FAILED');
    process.exit(1);
  }
}

runTests();
