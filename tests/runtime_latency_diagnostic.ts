/**
 * AC — Runtime Latency & Timeout Policy Diagnostic Script
 * Evaluates GeminiImageProvider behavior under simulated upstream latencies (55s vs 110s envelopes).
 */

import { GeminiImageProvider } from '../server/services/geminiImageProvider';

async function runDiagnostic() {
  console.log('========================================================');
  console.log('AC RUNTIME LATENCY & TIMEOUT POLICY DIAGNOSTIC');
  console.log('========================================================\n');

  // Diagnostic Probe 1: Method 1 (Two attempts of 3s max, upstream takes 4s per attempt)
  console.log('[Probe 1] Testing Method 1 (2 attempts x 3s max, upstream takes 4s)...');
  const providerM1 = new GeminiImageProvider({
    apiKey: 'mock-key',
    baseUrl: 'https://example.com/v1',
    timeoutMs: 3000
  });

  let attemptCountM1 = 0;
  const originalFetch = global.fetch;
  global.fetch = async (url: any, init: any) => {
    attemptCountM1++;
    const attemptNum = attemptCountM1;
    console.log(`  -> Upstream connection started for attempt #${attemptNum}`);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 4000); // 4s exceeds 3s attempt limit
      init.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Aborted by client/controller'));
      });
    });
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }] })
    } as any;
  };

  const startTimeM1 = Date.now();
  try {
    await providerM1.generate({ prompt: 'test latency M1', outfitFingerprint: 'FP_DIAG_1' });
  } catch (err: any) {
    const duration = Date.now() - startTimeM1;
    console.log(`  -> Result: FAILED after ${duration}ms`);
    console.log(`  -> Error Code: ${err.code || err.message}`);
    console.log(`  -> Total attempts executed: ${attemptCountM1}`);
  }

  // Diagnostic Probe 2: Method 2 (Single long attempt up to 8s, upstream takes 4s)
  console.log('\n[Probe 2] Testing Method 2 (Single attempt up to 8s, upstream takes 4s)...');
  const providerM2 = new GeminiImageProvider({
    apiKey: 'mock-key',
    baseUrl: 'https://example.com/v1',
    timeoutMs: 8000
  });

  let attemptCountM2 = 0;
  global.fetch = async (url: any, init: any) => {
    attemptCountM2++;
    console.log(`  -> Upstream connection started for attempt #${attemptCountM2}`);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 4000); // 4s is within 8s attempt limit
      init.signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new Error('Aborted by client/controller'));
      });
    });
    return {
      ok: true,
      status: 200,
      headers: { get: () => 'application/json' },
      json: async () => ({ data: [{ b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }] })
    } as any;
  };

  const startTimeM2 = Date.now();
  try {
    const res = await providerM2.generate({ prompt: 'test latency M2', outfitFingerprint: 'FP_DIAG_2' });
    const duration = Date.now() - startTimeM2;
    console.log(`  -> Result: SUCCESS in ${duration}ms! Image bytes received: ${res.bytes.length}`);
    console.log(`  -> Total attempts executed: ${attemptCountM2}`);
  } catch (err: any) {
    const duration = Date.now() - startTimeM2;
    console.log(`  -> Result: FAILED after ${duration}ms`);
    console.log(`  -> Error Code: ${err.code || err.message}`);
  }

  global.fetch = originalFetch;
  console.log('\n========================================================');
  console.log('DIAGNOSTIC COMPLETED SUCCESSFULLY');
  console.log('========================================================');
}

runDiagnostic().catch(err => {
  console.error('Diagnostic failed:', err);
  process.exit(1);
});
