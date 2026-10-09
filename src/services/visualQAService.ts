/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C: Visual QA Client Service
 *
 * Requirements:
 * - In-flight dedup + session caching
 * - Calls POST /api/verify-lookbook
 * - Handles 409 Conflict, 410 Gone, 429 Quota Cooldown, 503 Service Unavailable gracefully
 * - Connects with localStorage persistence (ac_visual_qa_v1)
 */

import { CulturalVisualQAOutput, VerifyLookbookRequest } from '../types/index';
import { loadPersistedVisualQA, savePersistedVisualQA } from './visualQAPersistence';

// In-memory session cache
const sessionVisualQACache = new Map<string, CulturalVisualQAOutput>();

// In-flight request deduplication map
const inFlightVisualQAMap = new Map<string, Promise<CulturalVisualQAOutput>>();

export class VisualQAError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(code: string, message: string, status: number, retryable = true) {
    super(message);
    this.name = 'VisualQAError';
    this.code = code;
    this.status = status;
    this.retryable = retryable;
  }
}

export function clearVisualQASessionCache(): void {
  sessionVisualQACache.clear();
  inFlightVisualQAMap.clear();
}

export async function verifyLookbookImage(
  req: VerifyLookbookRequest,
  signal?: AbortSignal
): Promise<CulturalVisualQAOutput> {
  const cacheKey = `${req.generationId}_${req.boundFingerprint}`;

  // 1. In-memory session cache check
  if (sessionVisualQACache.has(cacheKey)) {
    return sessionVisualQACache.get(cacheKey)!;
  }

  // 2. LocalStorage persistence check
  const persisted = loadPersistedVisualQA(req.generationId);
  if (persisted && persisted.boundFingerprint === req.boundFingerprint) {
    sessionVisualQACache.set(cacheKey, persisted);
    return persisted;
  }

  // 3. In-flight Promise deduplication
  if (inFlightVisualQAMap.has(cacheKey)) {
    return inFlightVisualQAMap.get(cacheKey)!;
  }

  const promise = (async () => {
    try {
      console.log('[VisualQA Client Diagnostic] Starting verifyLookbookImage:', {
        generationId: req.generationId,
        boundFingerprint: req.boundFingerprint,
        timestamp: new Date().toISOString(),
        hasSignal: !!signal,
        signalAborted: signal?.aborted || false,
        abortReason: signal?.reason ? String(signal.reason) : null
      });

      let res: Response;
      try {
        res = await fetch('/api/verify-lookbook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req),
          signal
        });
      } catch (fetchErr: any) {
        if (signal?.aborted || fetchErr?.name === 'AbortError') {
          throw new VisualQAError('QA_ABORTED', 'Yêu cầu thẩm định đã bị hủy.', 0, false);
        }
        throw new VisualQAError(
          'QA_NETWORK_ERROR',
          'Kết nối mạng bị gián đoạn. Ảnh của bạn đã được tạo an toàn, bạn có thể thử đánh giá lại.',
          0,
          true
        );
      }

      const contentType = res.headers.get('content-type') || '';
      const xAcApiResponse = res.headers.get('x-ac-api-response') || '0';
      const isJson = contentType.includes('application/json');

      if (!isJson || xAcApiResponse !== '1') {
        const bodyText = await res.text().catch(() => '');
        console.warn('[VisualQA Client Diagnostic] Non-JSON or Non-API Response Encountered:', {
          method: 'POST',
          requestUrl: '/api/verify-lookbook',
          responseUrl: res.url,
          redirected: res.redirected,
          status: res.status,
          statusText: res.statusText,
          contentType,
          xAcApiResponse,
          bodySnippet: bodyText.slice(0, 150).replace(/\s+/g, ' ')
        });

        const code = res.status === 504 ? 'QA_TIMEOUT' : 'QA_NON_JSON_RESPONSE';
        const message = 'AC chưa thể hoàn tất đánh giá bản phối lúc này. Ảnh của bạn đã được tạo an toàn.';
        throw new VisualQAError(code, message, res.status, true);
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        let code = errJson.code;
        if (!code) {
          code = res.status === 410 ? 'EPHEMERAL_IMAGE_EXPIRED'
            : res.status === 409 ? 'FINGERPRINT_MISMATCH'
            : res.status === 503 ? 'QA_SERVICE_UNAVAILABLE'
            : res.status === 504 ? 'QA_TIMEOUT'
            : res.status === 429 ? 'QA_SERVICE_UNAVAILABLE'
            : 'QA_INTERNAL_ERROR';
        }

        const message = errJson.message || `Lỗi đánh giá bản phối (${res.status})`;
        const retryable = res.status !== 410 && res.status !== 409;
        throw new VisualQAError(code, message, res.status, retryable);
      }

      let data: CulturalVisualQAOutput;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new VisualQAError(
          'QA_INVALID_RESPONSE',
          'Dữ liệu phản hồi đánh giá không thể giải mã JSON.',
          res.status,
          true
        );
      }

      if (!data || typeof data !== 'object' || !data.culturalIdentity || !data.outfitFidelity) {
        throw new VisualQAError(
          'QA_INVALID_RESPONSE',
          'Dữ liệu phản hồi đánh giá thiếu cấu trúc chuẩn.',
          res.status,
          true
        );
      }

      sessionVisualQACache.set(cacheKey, data);
      savePersistedVisualQA(data);
      return data;
    } finally {
      inFlightVisualQAMap.delete(cacheKey);
    }
  })();

  inFlightVisualQAMap.set(cacheKey, promise);
  return promise;
}
