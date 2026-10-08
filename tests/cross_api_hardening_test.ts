/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Cross-API Client Hardening & Recommendation Retry Lifecycle Regression Test Suite
 * MOCK ONLY: ZERO LIVE GEMINI OR OPENAI CALLS.
 */

import { recommendGarment, generateBlueprint, generateExplorationBlueprint, resetClientQuotaCooldown, ApiError } from '../src/services/geminiService';
import { verifyLookbookImage } from '../src/services/visualQAService';

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING CROSS-API HARDENING & RETRY LIFECYCLE TEST SUITE');
  console.log('MOCK MODE: ZERO LIVE GEMINI OR OPENAI CALLS');
  console.log('========================================================');

  const tests: Array<{ name: string; test: () => Promise<void> }> = [
    {
      name: '1. RECOMMENDATION_JSON_SUCCESS',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response(JSON.stringify({ primary: { garmentId: 'ao_tac' } }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-AC-API-Response': '1'
          }
        });
        try {
          const res = await recommendGarment({
            promptText: 'Test success',
            selectedOccasion: 'tet_temple',
            selectedStyle: 'balanced',
            traditionalRatio: 50
          });
          if (!res || res.primary.garmentId !== 'ao_tac') {
            throw new Error('Expected valid recommendation output');
          }
        } finally {
          global.fetch = originalFetch;
        }
      }
    },
    {
      name: '2. RECOMMENDATION_TYPED_JSON_ERROR',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response(JSON.stringify({
          code: 'GEMINI_QUOTA_EXHAUSTED',
          message: 'Quota exceeded for model'
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-AC-API-Response': '1'
          }
        });
        try {
          await recommendGarment({
            promptText: 'Test quota error',
            selectedOccasion: 'tet_temple',
            selectedStyle: 'balanced',
            traditionalRatio: 50
          });
          throw new Error('Expected ApiError to be thrown');
        } catch (err: any) {
          if (!(err instanceof ApiError) || err.code !== 'GEMINI_QUOTA_EXHAUSTED') {
            throw new Error(`Unexpected error: ${err.message}`);
          }
        } finally {
          global.fetch = originalFetch;
          resetClientQuotaCooldown();
        }
      }
    },
    {
      name: '3. RECOMMENDATION_HTML_200_DETECTION',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response('<!doctype html><html><body>Preview HTML</body></html>', {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'X-AC-API-Response': '0'
          }
        });
        try {
          await recommendGarment({
            promptText: 'Test HTML 200',
            selectedOccasion: 'tet_temple',
            selectedStyle: 'balanced',
            traditionalRatio: 50
          });
          throw new Error('Expected NON_JSON_RESPONSE error');
        } catch (err: any) {
          if (err.message.includes('Unexpected token')) {
            throw new Error('Raw syntax error escaped!');
          }
          if (!(err instanceof ApiError) || err.code !== 'NON_JSON_RESPONSE') {
            throw new Error(`Expected NON_JSON_RESPONSE code, got ${err.code}`);
          }
        } finally {
          global.fetch = originalFetch;
        }
      }
    },
    {
      name: '4. RECOMMENDATION_NON_JSON_NON_200',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response('Gateway Error', {
          status: 504,
          headers: {
            'Content-Type': 'text/plain',
            'X-AC-API-Response': '0'
          }
        });
        try {
          await recommendGarment({
            promptText: 'Test 504 HTML',
            selectedOccasion: 'tet_temple',
            selectedStyle: 'balanced',
            traditionalRatio: 50
          });
          throw new Error('Expected GATEWAY_TIMEOUT error');
        } catch (err: any) {
          if (!(err instanceof ApiError) || err.code !== 'GATEWAY_TIMEOUT') {
            throw new Error(`Expected GATEWAY_TIMEOUT code, got ${err.code}`);
          }
        } finally {
          global.fetch = originalFetch;
        }
      }
    },
    {
      name: '5. MISSING_AC_API_RESPONSE_MARKER',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-AC-API-Response': '0' // missing canonical marker
          }
        });
        try {
          await recommendGarment({
            promptText: 'Test missing marker',
            selectedOccasion: 'tet_temple',
            selectedStyle: 'balanced',
            traditionalRatio: 50
          });
          throw new Error('Expected NON_JSON_RESPONSE due to missing marker');
        } catch (err: any) {
          if (!(err instanceof ApiError) || err.code !== 'NON_JSON_RESPONSE') {
            throw new Error(`Expected NON_JSON_RESPONSE, got ${err.code}`);
          }
        } finally {
          global.fetch = originalFetch;
        }
      }
    },
    {
      name: '6. EXPLORATION_CLIENT_HTML_SURVIVAL',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response('<!doctype html><html>Preview</html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html', 'X-AC-API-Response': '0' }
        });
        try {
          await generateExplorationBlueprint({
            selectedGarmentId: 'ao_tac',
            parentBlueprint: {} as any,
            explorationIntent: 'MORE_TRADITIONAL',
            context: {
              promptText: 'test',
              selectedOccasion: 'tet_temple',
              selectedStyle: 'balanced',
              traditionalRatio: 50
            }
          });
          throw new Error('Expected exploration client to catch HTML response');
        } catch (err: any) {
          if (!(err instanceof ApiError) || err.code !== 'NON_JSON_RESPONSE') {
            throw new Error(`Expected NON_JSON_RESPONSE, got ${err.code}`);
          }
        } finally {
          global.fetch = originalFetch;
        }
      }
    },
    {
      name: '7. VISUAL_QA_CLIENT_DEFENSIVE_GREEN',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response(JSON.stringify({
          generationId: 'gen_1',
          boundFingerprint: 'fp_1',
          auditedAt: Date.now(),
          versions: { qaSchemaVersion: 'v1', culturalKnowledgeVersion: 'v1', visualAuditPolicyVersion: 'v1' },
          culturalIdentity: { overallStatus: 'PRESERVES_IDENTITY', statusLabelVi: 'Bảo toàn', assessableTraitsCount: 5, totalTraitsCount: 5, traits: [] },
          outfitFidelity: { overallFidelity: 'PASS', details: {} as any }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-AC-API-Response': '1' }
        });
        try {
          const res = await verifyLookbookImage({
            generationId: 'gen_1',
            boundFingerprint: 'fp_1'
          });
          if (!res || res.culturalIdentity.overallStatus !== 'PRESERVES_IDENTITY') {
            throw new Error('Expected valid Visual QA response');
          }
        } finally {
          global.fetch = originalFetch;
        }
      }
    },
    {
      name: '8. BLUEPRINT_CLIENT_DEFENSIVE_GREEN',
      test: async () => {
        resetClientQuotaCooldown();
        const originalFetch = global.fetch;
        global.fetch = async () => new Response(JSON.stringify({
          garmentId: 'ao_tac',
          remixProposal: { palette: [], fabricId: 'tho', lowerGarmentId: 'quan_au', footwearId: 'loafer', accessoryIds: [] },
          contextCautions: []
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'X-AC-API-Response': '1' }
        });
        try {
          const res = await generateBlueprint({
            selectedGarmentId: 'ao_tac',
            promptText: 'test',
            selectedOccasion: 'tet_temple',
            selectedStyle: 'balanced',
            traditionalRatio: 50
          });
          if (!res || res.garmentId !== 'ao_tac') {
            throw new Error('Expected valid blueprint response');
          }
        } finally {
          global.fetch = originalFetch;
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.test();
      console.log(`[PASS] ${t.name}`);
      passed++;
    } catch (err: any) {
      console.error(`[FAIL] ${t.name}:`, err.message);
      failed++;
    }
  }

  console.log('--------------------------------------------------------');
  console.log(`TOTAL TESTS: ${tests.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner execution error:', err);
  process.exit(1);
});
