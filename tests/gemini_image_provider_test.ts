/**
 * AC — Gemini Image Provider Unit Test Suite (Neutral Configurable Transport)
 */

import { GeminiImageProvider } from '../server/services/geminiImageProvider';
import { ImageProviderError } from '../server/services/imageProvider';
import sharp from 'sharp';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

async function runTests() {
  console.log('========================================================');
  console.log('RUNNING GEMINI IMAGE PROVIDER ADAPTER TEST SUITE');
  console.log('========================================================\n');

  // Test 1: Instantiation without IMAGE_API_KEY throws IMAGE_PROVIDER_NOT_CONFIGURED on generate
  try {
    const provider = new GeminiImageProvider({ apiKey: '', baseUrl: 'https://example.com/v1' });
    assert(provider.getModel() === 'req/gemini-3.0-pro-image', `Default model must be req/gemini-3.0-pro-image (got ${provider.getModel()})`);

    let threw = false;
    try {
      await provider.generate({ prompt: 'test', outfitFingerprint: 'FP123' });
    } catch (err: any) {
      threw = true;
      assert(err instanceof ImageProviderError, 'Error must be instance of ImageProviderError');
      assert(err.status === 503, 'Status must be 503');
      assert(err.code === 'IMAGE_PROVIDER_NOT_CONFIGURED', 'Code must be IMAGE_PROVIDER_NOT_CONFIGURED');
      assert(err.message.includes('IMAGE_API_KEY'), 'Message must mention missing IMAGE_API_KEY');
    }
    assert(threw, 'Should throw when IMAGE_API_KEY is not configured');

    results.push({ name: 'TEST_01_UNCONFIGURED_KEY_GUARD', passed: true, message: 'Unconfigured IMAGE_API_KEY correctly throws 503 IMAGE_PROVIDER_NOT_CONFIGURED' });
  } catch (err: any) {
    results.push({ name: 'TEST_01_UNCONFIGURED_KEY_GUARD', passed: false, message: err.message });
  }

  // Test 2: Missing IMAGE_API_BASE_URL throws IMAGE_PROVIDER_NOT_CONFIGURED
  try {
    const provider = new GeminiImageProvider({ apiKey: 'key-123', baseUrl: '' });

    let threw = false;
    try {
      await provider.generate({ prompt: 'test', outfitFingerprint: 'FP123' });
    } catch (err: any) {
      threw = true;
      assert(err instanceof ImageProviderError, 'Error must be instance of ImageProviderError');
      assert(err.status === 503, 'Status must be 503');
      assert(err.code === 'IMAGE_PROVIDER_NOT_CONFIGURED', 'Code must be IMAGE_PROVIDER_NOT_CONFIGURED');
      assert(err.message.includes('IMAGE_API_BASE_URL'), 'Message must mention missing IMAGE_API_BASE_URL');
    }
    assert(threw, 'Should throw when IMAGE_API_BASE_URL is missing');

    results.push({ name: 'TEST_02_MISSING_BASE_URL_GUARD', passed: true, message: 'Missing IMAGE_API_BASE_URL correctly throws 503 IMAGE_PROVIDER_NOT_CONFIGURED' });
  } catch (err: any) {
    results.push({ name: 'TEST_02_MISSING_BASE_URL_GUARD', passed: false, message: err.message });
  }

  // Test 3: No fallback to GEMINI_API_KEY or OPENAI_API_KEY when IMAGE_API_KEY is absent
  try {
    const oldGeminiKey = process.env.GEMINI_API_KEY;
    const oldCustomKey = process.env.CUSTOM_GEMINI_API_KEY;
    const oldOpenAIKey = process.env.OPENAI_API_KEY;
    const oldImageKey = process.env.IMAGE_API_KEY;

    process.env.GEMINI_API_KEY = 'fake-gemini-key';
    process.env.CUSTOM_GEMINI_API_KEY = 'fake-custom-key';
    process.env.OPENAI_API_KEY = 'fake-openai-key';
    delete process.env.IMAGE_API_KEY;

    const provider = new GeminiImageProvider({ baseUrl: 'https://example.com' });

    let threw = false;
    try {
      await provider.generate({ prompt: 'test', outfitFingerprint: 'FP123' });
    } catch (err: any) {
      threw = true;
      assert(err.code === 'IMAGE_PROVIDER_NOT_CONFIGURED', 'Must fail fast when IMAGE_API_KEY is missing');
    }
    assert(threw, 'Must not fallback to GEMINI_API_KEY or OPENAI_API_KEY');

    if (oldGeminiKey) process.env.GEMINI_API_KEY = oldGeminiKey; else delete process.env.GEMINI_API_KEY;
    if (oldCustomKey) process.env.CUSTOM_GEMINI_API_KEY = oldCustomKey; else delete process.env.CUSTOM_GEMINI_API_KEY;
    if (oldOpenAIKey) process.env.OPENAI_API_KEY = oldOpenAIKey; else delete process.env.OPENAI_API_KEY;
    if (oldImageKey) process.env.IMAGE_API_KEY = oldImageKey; else delete process.env.IMAGE_API_KEY;

    results.push({ name: 'TEST_03_NO_FALLBACK_TO_OTHER_KEYS', passed: true, message: 'Strictly rejects fallbacks to GEMINI_API_KEY, CUSTOM_GEMINI_API_KEY, or OPENAI_API_KEY' });
  } catch (err: any) {
    results.push({ name: 'TEST_03_NO_FALLBACK_TO_OTHER_KEYS', passed: false, message: err.message });
  }

  // Test 4: Custom config overriding model and timeout
  try {
    const customProvider = new GeminiImageProvider({
      apiKey: 'test-key',
      baseUrl: 'https://example.com/v1',
      model: 'req/gemini-3.0-pro-image-custom',
      timeoutMs: 60000
    });
    assert(customProvider.getModel() === 'req/gemini-3.0-pro-image-custom', 'Custom model name preserved');

    results.push({ name: 'TEST_04_CUSTOM_CONFIG', passed: true, message: 'Custom model and timeout config respected' });
  } catch (err: any) {
    results.push({ name: 'TEST_04_CUSTOM_CONFIG', passed: false, message: err.message });
  }

  // Test 5: Mock fetch response parsing & transformToTrue3x4
  try {
    const rawBuffer = await sharp({
      create: { width: 1024, height: 1536, channels: 3, background: { r: 100, g: 150, b: 200 } }
    }).jpeg().toBuffer();

    const mockBase64 = rawBuffer.toString('base64');

    const originalFetch = global.fetch;
    global.fetch = async (url: any, init: any) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            { b64_json: mockBase64 }
          ]
        })
      } as any;
    };

    const provider = new GeminiImageProvider({ apiKey: 'mock-key', baseUrl: 'https://example.com' });
    const payload = await provider.generate({ prompt: 'A stylish Vietnam outfit', outfitFingerprint: 'FP-TEST' });

    global.fetch = originalFetch;

    assert(payload.bytes instanceof Buffer, 'Payload bytes must be Buffer');
    assert(payload.mimeType === 'image/jpeg', 'Mime type must match');
    assert(payload.width === 1152, `Transformed width must be 1152 (got ${payload.width})`);
    assert(payload.height === 1536, `Transformed height must be 1536 (got ${payload.height})`);

    results.push({ name: 'TEST_05_MOCK_GENERATE_SUCCESS', passed: true, message: 'Parsed mock b64_json and transformed to 1152x1536 true 3:4 payload' });
  } catch (err: any) {
    results.push({ name: 'TEST_05_MOCK_GENERATE_SUCCESS', passed: false, message: err.message });
  }

  // Test 6: Missing b64_json in response
  try {
    const originalFetch = global.fetch;
    global.fetch = async (url: any, init: any) => {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: []
        })
      } as any;
    };

    const provider = new GeminiImageProvider({ apiKey: 'mock-key', baseUrl: 'https://example.com' });

    let threw = false;
    try {
      await provider.generate({ prompt: 'test', outfitFingerprint: 'FP123' });
    } catch (err: any) {
      threw = true;
      assert(err instanceof ImageProviderError, 'Must be ImageProviderError');
      assert(err.status === 502, 'Status must be 502');
      assert(err.code === 'IMAGE_GENERATION_FAILED', 'Code must be IMAGE_GENERATION_FAILED');
    }
    global.fetch = originalFetch;
    assert(threw, 'Should throw 502 when no image data returned');

    results.push({ name: 'TEST_06_NO_INLINE_DATA_GUARD', passed: true, message: 'Missing b64_json throws 502 IMAGE_GENERATION_FAILED' });
  } catch (err: any) {
    results.push({ name: 'TEST_06_NO_INLINE_DATA_GUARD', passed: false, message: err.message });
  }

  // Test 7: Auth Error handling (401 / unauthorized)
  try {
    const originalFetch = global.fetch;
    global.fetch = async (url: any, init: any) => {
      return {
        ok: false,
        status: 401,
        text: async () => 'Unauthorized API key'
      } as any;
    };

    const provider = new GeminiImageProvider({ apiKey: 'bad-key', baseUrl: 'https://example.com' });

    let threw = false;
    try {
      await provider.generate({ prompt: 'test', outfitFingerprint: 'FP123' });
    } catch (err: any) {
      threw = true;
      assert(err instanceof ImageProviderError, 'Must be ImageProviderError');
      assert(err.status === 401, 'Status must be mapped to 401');
      assert(err.code === 'IMAGE_PROVIDER_AUTH_ERROR', 'Code must be IMAGE_PROVIDER_AUTH_ERROR');
    }
    global.fetch = originalFetch;
    assert(threw, 'Should throw 401 for unauthorized key');

    results.push({ name: 'TEST_07_AUTH_ERROR_MAPPING', passed: true, message: 'Unauthorized error mapped to 401 IMAGE_PROVIDER_AUTH_ERROR' });
  } catch (err: any) {
    results.push({ name: 'TEST_07_AUTH_ERROR_MAPPING', passed: false, message: err.message });
  }

  console.log('--------------------------------------------------------------------------------');
  let passedCount = 0;
  for (const r of results) {
    if (r.passed) passedCount++;
    console.log(`| ${r.name.padEnd(35)} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.message}`);
  }
  console.log('--------------------------------------------------------------------------------');
  console.log(`TOTAL: ${results.length} | PASSED: ${passedCount} | FAILED: ${results.length - passedCount}`);

  if (passedCount < results.length) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
