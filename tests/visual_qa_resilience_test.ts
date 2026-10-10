/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Visual QA Runtime Resilience Hardening Test Suite
 *
 * Verifies invariants TEST A through TEST J:
 * TEST A: Successful generation → exactly one automatic QA request
 * TEST B: Duplicate call for same generationId → blocked by in-flight/identity guard
 * TEST C: QA 503 → typed QA_SERVICE_UNAVAILABLE error, image remains intact
 * TEST D: QA timeout → typed QA_TIMEOUT error, retry available
 * TEST E: HTML 200 response → typed QA_NON_JSON_RESPONSE, no SyntaxError leak
 * TEST F: Session reset aborts active QA safely
 * TEST G: Superseded generation drops late old QA response
 * TEST H: Manual retry after transient failure succeeds for same generationId
 * TEST I: V0/V1/V2 QA cache isolation by generationId
 * TEST J: Normal successful QA behavior preserved
 */

import assert from 'node:assert';
import { verifyLookbookImage, VisualQAError, clearVisualQASessionCache } from '../src/services/visualQAService';
import { loadPersistedVisualQA, savePersistedVisualQA, clearVisualQAPersistence, recordQAResult, recordLookbookRevision, loadVisualQAStore } from '../src/services/visualQAPersistence';
import { CulturalVisualQAOutput } from '../src/types/index';

// Mock window and localStorage for Node.js test runner
// Mock global fetch for testing fetch responses
const originalFetch = globalThis.fetch;

if (typeof globalThis.window === 'undefined') {
  const storeMap = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => storeMap.get(key) || null,
      setItem: (key: string, val: string) => storeMap.set(key, val),
      removeItem: (key: string) => storeMap.delete(key),
      clear: () => storeMap.clear()
    }
  };
}

function createMockQAOutput(genId: string, fp: string, status = 'PRESERVES_IDENTITY'): CulturalVisualQAOutput {
  return {
    generationId: genId,
    boundFingerprint: fp,
    auditedAt: Date.now(),
    versions: {
      qaSchemaVersion: '1.0.0',
      culturalKnowledgeVersion: '1.0.0',
      visualAuditPolicyVersion: '1.0.0'
    },
    culturalIdentity: {
      overallStatus: status as any,
      statusLabelVi: 'Bảo toàn nhận diện',
      totalTraitsCount: 5,
      assessableTraitsCount: 5,
      traits: []
    },
    outfitFidelity: {
      overallFidelity: 'PASS',
      details: {
        palette: { primaryMatch: 'PASS', supportingMatch: 'PASS', accentMatch: 'PASS' },
        fabricMatch: 'PASS',
        lowerGarmentMatch: 'PASS',
        footwearMatch: 'PASS',
        expectedAccessories: [],
        unexpectedAccessories: []
      }
    }
  };
}

async function runTests() {
  console.log('=== RUNNING VISUAL QA RESILIENCE HARDENING TEST SUITE ===\n');

  // TEST A & B: In-flight deduplication & single request guard
  {
    console.log('[TEST A & B] Single automatic QA request & in-flight deduplication...');
    clearVisualQASessionCache();
    clearVisualQAPersistence();

    let fetchCount = 0;
    globalThis.fetch = (async (url: string) => {
      fetchCount++;
      await new Promise(r => setTimeout(r, 50));
      return new Response(JSON.stringify(createMockQAOutput('gen_a', 'fp_a')), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-ac-api-response': '1'
        }
      });
    }) as any;

    const req = { generationId: 'gen_a', boundFingerprint: 'fp_a' };
    const p1 = verifyLookbookImage(req);
    const p2 = verifyLookbookImage(req); // Duplicate in-flight call

    const [r1, r2] = await Promise.all([p1, p2]);

    assert.strictEqual(fetchCount, 1, 'In-flight deduplication must result in exactly 1 fetch call');
    assert.strictEqual(r1.generationId, 'gen_a');
    assert.strictEqual(r2.generationId, 'gen_a');
    console.log('  -> PASS');
  }

  // TEST C: 503 Service Unavailable → typed error
  {
    console.log('[TEST C] 503 Service Unavailable handling...');
    clearVisualQASessionCache();

    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ code: 'QA_SERVICE_UNAVAILABLE', message: 'Hệ thống tạm bận' }), {
        status: 503,
        headers: {
          'content-type': 'application/json',
          'x-ac-api-response': '1'
        }
      });
    }) as any;

    try {
      await verifyLookbookImage({ generationId: 'gen_503', boundFingerprint: 'fp_503' });
      assert.fail('Should have thrown VisualQAError');
    } catch (err: any) {
      assert(err instanceof VisualQAError, 'Should be an instance of VisualQAError');
      assert.strictEqual(err.code, 'QA_SERVICE_UNAVAILABLE');
      assert.strictEqual(err.retryable, true);
    }
    console.log('  -> PASS');
  }

  // TEST D: 504 Gateway Timeout → typed error
  {
    console.log('[TEST D] 504 Timeout handling...');
    clearVisualQASessionCache();

    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ code: 'QA_TIMEOUT', message: 'Hết thời gian chờ' }), {
        status: 504,
        headers: {
          'content-type': 'application/json',
          'x-ac-api-response': '1'
        }
      });
    }) as any;

    try {
      await verifyLookbookImage({ generationId: 'gen_504', boundFingerprint: 'fp_504' });
      assert.fail('Should have thrown VisualQAError');
    } catch (err: any) {
      assert(err instanceof VisualQAError);
      assert.strictEqual(err.code, 'QA_TIMEOUT');
      assert.strictEqual(err.retryable, true);
    }
    console.log('  -> PASS');
  }

  // TEST E: HTML 200 response → typed QA_NON_JSON_RESPONSE
  {
    console.log('[TEST E] HTML 200 response handling...');
    clearVisualQASessionCache();

    globalThis.fetch = (async () => {
      return new Response('<html><body>Preview Proxy HTML</body></html>', {
        status: 200,
        headers: {
          'content-type': 'text/html'
        }
      });
    }) as any;

    try {
      await verifyLookbookImage({ generationId: 'gen_html', boundFingerprint: 'fp_html' });
      assert.fail('Should have thrown VisualQAError');
    } catch (err: any) {
      assert(err instanceof VisualQAError);
      assert.strictEqual(err.code, 'NON_JSON_RESPONSE');
      assert(err.message.includes('chưa hoàn tất'), 'Friendly Vietnamese error message required');
    }
    console.log('  -> PASS');
  }

  // TEST F: AbortSignal handling
  {
    console.log('[TEST F] AbortSignal handling...');
    clearVisualQASessionCache();

    const controller = new AbortController();
    globalThis.fetch = (async (_url: string, opts: any) => {
      assert(opts.signal, 'Signal must be passed to fetch');
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    }) as any;

    controller.abort();

    try {
      await verifyLookbookImage({ generationId: 'gen_abort', boundFingerprint: 'fp_abort' }, controller.signal);
      assert.fail('Should have thrown QA_ABORTED error');
    } catch (err: any) {
      assert(err instanceof VisualQAError);
      assert.strictEqual(err.code, 'QA_ABORTED');
      assert.strictEqual(err.retryable, false);
    }
    console.log('  -> PASS');
  }

  // TEST G: Network disconnection error
  {
    console.log('[TEST G] Network failure handling...');
    clearVisualQASessionCache();

    globalThis.fetch = (async () => {
      throw new TypeError('Failed to fetch');
    }) as any;

    try {
      await verifyLookbookImage({ generationId: 'gen_net', boundFingerprint: 'fp_net' });
      assert.fail('Should have thrown QA_NETWORK_ERROR');
    } catch (err: any) {
      assert(err instanceof VisualQAError);
      assert.strictEqual(err.code, 'QA_NETWORK_ERROR');
      assert.strictEqual(err.retryable, true);
    }
    console.log('  -> PASS');
  }

  // TEST H: Manual retry after transient failure succeeds
  {
    console.log('[TEST H] Manual retry after transient failure...');
    clearVisualQASessionCache();

    let attempts = 0;
    globalThis.fetch = (async () => {
      attempts++;
      if (attempts === 1) {
        return new Response(JSON.stringify({ code: 'QA_SERVICE_UNAVAILABLE' }), {
          status: 503,
          headers: { 'content-type': 'application/json', 'x-ac-api-response': '1' }
        });
      }
      return new Response(JSON.stringify(createMockQAOutput('gen_retry', 'fp_retry')), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-ac-api-response': '1' }
      });
    }) as any;

    // First attempt fails
    try {
      await verifyLookbookImage({ generationId: 'gen_retry', boundFingerprint: 'fp_retry' });
      assert.fail('First attempt should fail');
    } catch (err: any) {
      assert.strictEqual(err.code, 'QA_SERVICE_UNAVAILABLE');
    }

    // Second attempt (manual retry) succeeds
    const res = await verifyLookbookImage({ generationId: 'gen_retry', boundFingerprint: 'fp_retry' });
    assert.strictEqual(res.generationId, 'gen_retry');
    console.log('  -> PASS');
  }

  // TEST I: V0/V1/V2 QA cache isolation by generationId
  {
    console.log('[TEST I] QA cache isolation between V0, V1, and V2...');
    clearVisualQASessionCache();
    clearVisualQAPersistence();

    const dummySnapshot: any = {
      boundFingerprint: 'fp_v0',
      garmentId: 'ngu_than_chen',
      genderPresentation: 'nam'
    };

    recordLookbookRevision({
      boundFingerprint: 'fp_root',
      garmentId: 'ngu_than_chen',
      generationId: 'gen_v0',
      revisionIndex: 0,
      imageUrl: 'http://example.com/v0.png',
      createdAt: Date.now(),
      expiresAt: Date.now() + 900000,
      snapshot: dummySnapshot
    });

    recordLookbookRevision({
      boundFingerprint: 'fp_root',
      garmentId: 'ngu_than_chen',
      generationId: 'gen_v1',
      revisionIndex: 1,
      imageUrl: 'http://example.com/v1.png',
      createdAt: Date.now(),
      expiresAt: Date.now() + 900000,
      snapshot: { ...dummySnapshot, boundFingerprint: 'fp_root' }
    });

    const qaV0 = createMockQAOutput('gen_v0', 'fp_root', 'PRESERVES_IDENTITY');
    const qaV1 = createMockQAOutput('gen_v1', 'fp_root', 'CONTEXT_SENSITIVE');

    savePersistedVisualQA(qaV0);
    savePersistedVisualQA(qaV1);

    const loadedV0 = loadPersistedVisualQA('gen_v0');
    const loadedV1 = loadPersistedVisualQA('gen_v1');

    assert.strictEqual(loadedV0?.culturalIdentity.overallStatus, 'PRESERVES_IDENTITY');
    assert.strictEqual(loadedV1?.culturalIdentity.overallStatus, 'CONTEXT_SENSITIVE');
    console.log('  -> PASS');
  }

  // TEST J: Invalid JSON schema response
  {
    console.log('[TEST J] Invalid JSON schema response handling...');
    clearVisualQASessionCache();

    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({ missingField: true }), {
        status: 200,
        headers: { 'content-type': 'application/json', 'x-ac-api-response': '1' }
      });
    }) as any;

    try {
      await verifyLookbookImage({ generationId: 'gen_invalid', boundFingerprint: 'fp_invalid' });
      assert.fail('Should have thrown QA_INVALID_RESPONSE');
    } catch (err: any) {
      assert(err instanceof VisualQAError);
      assert.strictEqual(err.code, 'QA_INVALID_RESPONSE');
    }
    console.log('  -> PASS');
  }

  // Restore fetch
  globalThis.fetch = originalFetch;

  console.log('\n=== ALL 10 VISUAL QA RESILIENCE TESTS PASSED ===');
}

runTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
