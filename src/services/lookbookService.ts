/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2B: Lookbook Image Client Service
 */

import { GenerateLookbookRequest, GenerateLookbookResponse } from '../types/index';

export class LookbookError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.name = 'LookbookError';
    this.code = code;
    this.status = status;
  }
}

export async function requestLookbookGeneration(
  payload: GenerateLookbookRequest
): Promise<GenerateLookbookResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 125000); // 125s client timeout

  try {
    const res = await fetch('/api/generate-lookbook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const code = data.code || 'IMAGE_GENERATION_FAILED';
      const message =
        data.message ||
        (res.status === 409
          ? 'Bản phối đã thay đổi. Vui lòng tạo ảnh lại từ phiên bản hiện tại.'
          : res.status === 503
          ? 'Dịch vụ tạo ảnh đang tạm thời không khả dụng. Vui lòng thử lại sau.'
          : 'Không thể tạo hình ảnh minh họa lúc này. Vui lòng thử lại.');

      throw new LookbookError(code, message, res.status);
    }

    return data as GenerateLookbookResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err instanceof LookbookError) {
      throw err;
    }

    if (err.name === 'AbortError') {
      throw new LookbookError(
        'IMAGE_GENERATION_TIMEOUT',
        'Quá trình tạo ảnh mất nhiều thời gian hơn dự kiến. Bạn có thể thử lại.',
        504
      );
    }

    throw new LookbookError(
      'NETWORK_ERROR',
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.',
      0
    );
  }
}
