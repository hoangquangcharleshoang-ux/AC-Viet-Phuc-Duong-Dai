/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2B: OpenAI Image Generation Provider
 *
 * Current GPT Image API Integration:
 * - Uses official 'openai' SDK (v7.28.0)
 * - Server-side only (OPENAI_API_KEY never exposed to frontend)
 * - Configured model: process.env.IMAGE_PROVIDER_MODEL ?? 'gpt-image-2.5-flare'
 * - Known-good baseline configuration:
 *   - model: 'gpt-image-2.5-flare'
 *   - size: '1024x1024'
 *   - quality: 'low'
 *   - n: 1
 *   - output_format: 'jpeg'
 * - NO legacy response_format parameter ('b64_json' / 'url' removed completely)
 * - Base64 decoded to Buffer with mimeType 'image/jpeg'
 * - Sanitized diagnostics for error inspection without leaking authorization/API keys
 * - Bounded retry for transient 5xx only; fail-fast (0 retry) for 401/403/429/400
 */

import OpenAI from 'openai';
import {
  ImageProvider,
  ImageGenerationInput,
  GeneratedImagePayload,
  ImageProviderError
} from './imageProvider';
import { transformToTrue3x4 } from './imageTransformer';

export interface OpenAIProviderConfig {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

function sanitizeErrorMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/sk-[a-zA-Z0-9_\-]{10,}/g, 'sk-[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/apiKey\s*[:=]\s*["']?[^"'\s,]+/gi, 'apiKey:[REDACTED]');
}

export class OpenAIImageProvider implements ImageProvider {
  private client: OpenAI | null = null;
  private model: string;
  private timeoutMs: number;

  constructor(config?: OpenAIProviderConfig) {
    const apiKey = config?.apiKey || process.env.OPENAI_API_KEY;
    this.model =
      config?.model ||
      process.env.IMAGE_PROVIDER_MODEL ||
      'gpt-image-2.5-flare';
    this.timeoutMs =
      config?.timeoutMs ||
      parseInt(process.env.IMAGE_GENERATION_TIMEOUT_MS || '120000', 10);

    const apiKeyPresent = Boolean(apiKey && apiKey.trim().length > 0);

    // Environment Check Log (Sanitized, zero secret leakage)
    console.log('[OpenAIImageProvider] Environment Configuration:', {
      OPENAI_API_KEY_PRESENT: apiKeyPresent,
      IMAGE_PROVIDER: process.env.IMAGE_PROVIDER || 'openai',
      IMAGE_PROVIDER_MODEL: this.model,
      IMAGE_GENERATION_TIMEOUT_MS: this.timeoutMs,
      IMAGE_EPHEMERAL_TTL_MS: parseInt(process.env.IMAGE_EPHEMERAL_TTL_MS || '1800000', 10)
    });

    if (apiKeyPresent) {
      this.client = new OpenAI({
        apiKey: apiKey!.trim(),
        timeout: this.timeoutMs
      });
    }
  }

  public getModel(): string {
    return this.model;
  }

  public async generate(input: ImageGenerationInput): Promise<GeneratedImagePayload> {
    if (!this.client) {
      throw new ImageProviderError(
        503,
        'IMAGE_PROVIDER_NOT_CONFIGURED',
        'Dịch vụ tạo ảnh chưa được cấu hình. Vui lòng cung cấp OPENAI_API_KEY trong môi trường server.',
        false
      );
    }

    const { prompt } = input;
    let attempt = 0;
    const maxAttempts = 2; // initial + max 1 transient retry

    // Known-good baseline configuration as verified in OpenAI Dashboard (Portrait 1024x1536)
    const requestParams = {
      model: this.model,
      prompt,
      size: '1024x1536' as const,
      quality: 'low' as const,
      n: 1,
      output_format: 'jpeg' as const
    };

    while (attempt < maxAttempts) {
      attempt++;
      try {
        const response = await this.client.images.generate(requestParams);

        const imageItem = response.data?.[0];
        if (!imageItem || !imageItem.b64_json) {
          throw new ImageProviderError(
            502,
            'IMAGE_GENERATION_FAILED',
            'Không nhận được dữ liệu base64 hình ảnh từ nhà cung cấp dịch vụ.',
            false
          );
        }

        const buffer = Buffer.from(imageItem.b64_json, 'base64');
        const transformed = await transformToTrue3x4(buffer, 'image/jpeg');
        return {
          bytes: transformed.bytes,
          mimeType: transformed.mimeType,
          width: transformed.width,
          height: transformed.height
        };
      } catch (err: any) {
        if (err instanceof ImageProviderError) {
          throw err;
        }

        const status =
          err?.status ||
          err?.statusCode ||
          (err instanceof OpenAI.APIError ? err.status : undefined) ||
          500;
        const errorCode =
          err?.code ||
          (err?.error && typeof err.error === 'object' ? (err.error as any).code : undefined);
        const errorType =
          err?.type ||
          (err?.error && typeof err.error === 'object' ? (err.error as any).type : undefined);
        const param =
          err?.param ||
          (err?.error && typeof err.error === 'object' ? (err.error as any).param : undefined);
        const requestId = err?.requestID || err?.request_id;
        const rawErrMsg = err?.message || String(err);
        const sanitizedErrMsg = sanitizeErrorMessage(rawErrMsg);

        // Detailed sanitized diagnostics (No credentials, no full prompt, no base64)
        console.error('[OpenAIImageProvider] Generation Error:', {
          stage: 'images.generate',
          model: requestParams.model,
          size: requestParams.size,
          quality: requestParams.quality,
          outputFormat: requestParams.output_format,
          httpStatus: status,
          errorCode: errorCode || null,
          errorType: errorType || null,
          param: param || null,
          requestId: requestId || null,
          errorMessageSanitized: sanitizedErrMsg
        });

        const errMsgLower = rawErrMsg.toLowerCase();

        // 1. Auth errors (401 / 403) -> Fail fast, 0 retry
        if (
          status === 401 ||
          status === 403 ||
          errMsgLower.includes('api_key') ||
          errMsgLower.includes('unauthorized') ||
          errMsgLower.includes('forbidden')
        ) {
          throw new ImageProviderError(
            status === 403 ? 403 : 401,
            'IMAGE_PROVIDER_AUTH_ERROR',
            'Khóa xác thực dịch vụ tạo ảnh không hợp lệ hoặc thiếu quyền truy cập.',
            false
          );
        }

        // 2. Rate limit / Quota (429) -> Fail fast, 0 retry
        if (status === 429 || errMsgLower.includes('rate limit') || errMsgLower.includes('quota')) {
          throw new ImageProviderError(
            429,
            'IMAGE_PROVIDER_RATE_LIMITED',
            'Dịch vụ tạo ảnh đang tạm thời vượt quá hạn mức sử dụng. Vui lòng thử lại sau ít phút.',
            false
          );
        }

        // 3. Timeout error
        if (errMsgLower.includes('timeout') || errMsgLower.includes('timed out') || err?.code === 'ETIMEDOUT') {
          throw new ImageProviderError(
            504,
            'IMAGE_GENERATION_TIMEOUT',
            'Quá trình tạo ảnh mất nhiều thời gian hơn dự kiến. Bạn có thể thử lại.',
            true
          );
        }

        // 4. Transient 5xx or Network error -> Bounded retry once
        const isTransient = status >= 500 || errMsgLower.includes('econnreset') || errMsgLower.includes('socket hang up');
        if (isTransient && attempt < maxAttempts) {
          console.warn(
            `[OpenAIImageProvider] Transient error (attempt ${attempt}/${maxAttempts}), retrying once...`,
            sanitizedErrMsg
          );
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }

        // 5. Client errors (400, etc.) or non-transient failures
        throw new ImageProviderError(
          status >= 500 ? 503 : 400,
          status >= 500 ? 'IMAGE_PROVIDER_UNAVAILABLE' : 'IMAGE_GENERATION_FAILED',
          status >= 500
            ? 'Dịch vụ tạo ảnh đang tạm thời không khả dụng. Vui lòng thử lại sau.'
            : 'Yêu cầu tạo ảnh không thể hoàn tất. Vui lòng kiểm tra lại cấu hình.',
          isTransient
        );
      }
    }

    throw new ImageProviderError(
      503,
      'IMAGE_PROVIDER_UNAVAILABLE',
      'Dịch vụ tạo ảnh đang tạm thời không khả dụng sau khi thử lại. Vui lòng thử lại sau.',
      true
    );
  }
}
