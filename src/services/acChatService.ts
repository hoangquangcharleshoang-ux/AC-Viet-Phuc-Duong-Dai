/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Client-Side AC Chat Service (Read-Only)
 */

import { ACChatRequestPayload, ACChatResponse } from '../types/index';

export class ACChatServiceError extends Error {
  status: number;
  code: string;
  retryable: boolean;

  constructor(status: number, code: string, message: string, retryable = true) {
    super(message);
    this.name = 'ACChatServiceError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Sends a message to the AC Chat backend
 */
export async function sendACChatMessage(
  payload: ACChatRequestPayload,
  signal?: AbortSignal
): Promise<ACChatResponse> {
  try {
    const res = await fetch('/api/ac-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AC-API-Response': '1'
      },
      body: JSON.stringify(payload),
      signal
    });

    // Validate canonical response marker
    const hasMarker = res.headers.get('X-AC-API-Response') === '1';
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let errData: any = {};
      try {
        if (contentType.includes('application/json')) {
          errData = await res.json();
        }
      } catch {
        // ignore json parse error on non-ok
      }
      throw new ACChatServiceError(
        res.status,
        errData.code || `HTTP_${res.status}`,
        errData.message || 'Không thể kết nối với dịch vụ AC Chat. Vui lòng thử lại.',
        errData.retryable ?? true
      );
    }

    if (!contentType.includes('application/json') || !hasMarker) {
      throw new ACChatServiceError(
        502,
        'INVALID_API_TRANSPORT',
        'Máy chủ trả về phản hồi không thể xử lý. Vui lòng thử lại.',
        true
      );
    }

    const data = await res.json();
    return data as ACChatResponse;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof ACChatServiceError) {
      throw err;
    }
    throw new ACChatServiceError(
      500,
      'NETWORK_OR_CLIENT_ERROR',
      err.message || 'Lỗi kết nối mạng, vui lòng kiểm tra kết nối và thử lại.',
      true
    );
  }
}

/**
 * Applies a server-authoritative mutation via POST /api/ac-chat/mutate
 */
export async function applyACChatMutation(
  payload: { actionId: string; currentFingerprint: string; chatSessionId: string },
  signal?: AbortSignal
): Promise<import('../types/index').ACChatMutateResult> {
  try {
    const res = await fetch('/api/ac-chat/mutate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AC-API-Response': '1'
      },
      body: JSON.stringify(payload),
      signal
    });

    const hasMarker = res.headers.get('X-AC-API-Response') === '1';
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let errData: any = {};
      try {
        if (contentType.includes('application/json')) {
          errData = await res.json();
        }
      } catch {
        // ignore json parse error
      }
      throw new ACChatServiceError(
        res.status,
        errData.code || `HTTP_${res.status}`,
        errData.message || 'Không thể áp dụng gợi ý này lúc này. Vui lòng thử lại.',
        false
      );
    }

    if (!contentType.includes('application/json') || !hasMarker) {
      throw new ACChatServiceError(
        502,
        'INVALID_API_TRANSPORT',
        'Máy chủ trả về phản hồi không thể xử lý. Vui lòng thử lại.',
        false
      );
    }

    const data = await res.json();
    return data as import('../types/index').ACChatMutateResult;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (err instanceof ACChatServiceError) {
      throw err;
    }
    throw new ACChatServiceError(
      500,
      'NETWORK_OR_CLIENT_ERROR',
      err.message || 'Lỗi kết nối mạng, vui lòng kiểm tra kết nối và thử lại.',
      false
    );
  }
}
