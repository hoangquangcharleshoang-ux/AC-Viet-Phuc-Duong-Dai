/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Configurable OpenAI-Compatible Image Generation Provider
 *
 * Configured Image API Transport:
 * - Uses neutral OpenAI-compatible HTTP request transport (POST /v1/images/generations)
 * - Server-side only (IMAGE_API_KEY never exposed to frontend)
 * - Configured model: process.env.IMAGE_PROVIDER_MODEL ?? 'req/gemini-3.0-pro-image'
 * - Native 3:4 aspect ratio support
 * - Real image dimensions decoded via sharp
 * - Sanitized diagnostics for error inspection without leaking authorization/API keys
 * - Bounded retry for transient errors; fail-fast for auth / rate limit / bad request
 */

import {
  ImageProvider,
  ImageGenerationInput,
  GeneratedImagePayload,
  ImageProviderError
} from './imageProvider';
import { transformToTrue3x4 } from './imageTransformer';

export interface GeminiProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
}

function sanitizeErrorMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/sk-[a-zA-Z0-9_\-]{10,}/g, 'sk-[REDACTED]')
    .replace(/AIza[a-zA-Z0-9_\-]{30,}/g, 'AIza[REDACTED]')
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, 'Bearer [REDACTED]')
    .replace(/apiKey\s*[:=]\s*["']?[^"'\s,]+/gi, 'apiKey:[REDACTED]');
}

export class GeminiImageProvider implements ImageProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private timeoutMs: number;
  private apiKeyPresent: boolean = false;
  private baseUrlPresent: boolean = false;
  private missingConfigMessage: string | null = null;

  constructor(config?: GeminiProviderConfig) {
    const apiKey = config?.apiKey !== undefined ? config.apiKey : process.env.IMAGE_API_KEY;
    const baseUrl = config?.baseUrl !== undefined ? config.baseUrl : process.env.IMAGE_API_BASE_URL;
    const envModel = process.env.IMAGE_PROVIDER_MODEL;

    this.apiKey = apiKey || '';
    this.baseUrl = baseUrl || '';
    this.model =
      config?.model ||
      (envModel && envModel.trim().length > 0 && !envModel.toLowerCase().includes('gpt')
        ? envModel.trim()
        : 'req/gemini-3.0-pro-image');
    this.timeoutMs =
      config?.timeoutMs ||
      parseInt(process.env.IMAGE_GENERATION_TIMEOUT_MS || '120000', 10);

    this.apiKeyPresent = Boolean(this.apiKey && this.apiKey.trim().length > 0);
    this.baseUrlPresent = Boolean(this.baseUrl && this.baseUrl.trim().length > 0);

    if (!this.apiKeyPresent) {
      this.missingConfigMessage =
        'Dịch vụ tạo ảnh chưa được cấu hình. Vui lòng cung cấp IMAGE_API_KEY trong môi trường server.';
    } else if (!this.baseUrlPresent) {
      this.missingConfigMessage =
        'Dịch vụ tạo ảnh chưa được cấu hình. Vui lòng cung cấp IMAGE_API_BASE_URL trong môi trường server.';
    }

    console.log('[GeminiImageProvider] Environment Configuration:', {
      IMAGE_API_KEY_PRESENT: this.apiKeyPresent,
      IMAGE_API_BASE_URL_PRESENT: this.baseUrlPresent,
      IMAGE_PROVIDER_MODEL: this.model,
      IMAGE_GENERATION_TIMEOUT_MS: this.timeoutMs,
      IMAGE_EPHEMERAL_TTL_MS: parseInt(process.env.IMAGE_EPHEMERAL_TTL_MS || '1800000', 10)
    });
  }

  public getModel(): string {
    return this.model;
  }

  public async generate(input: ImageGenerationInput): Promise<GeneratedImagePayload> {
    if (!this.apiKeyPresent || !this.baseUrlPresent || this.missingConfigMessage) {
      throw new ImageProviderError(
        503,
        'IMAGE_PROVIDER_NOT_CONFIGURED',
        this.missingConfigMessage ||
          'Dịch vụ tạo ảnh chưa được cấu hình. Vui lòng cung cấp IMAGE_API_KEY và IMAGE_API_BASE_URL trong môi trường server.',
        false
      );
    }

    const { prompt } = input;
    let attempt = 0;
    const maxAttempts = 2; // initial + max 1 transient retry

    const cleanBase = this.baseUrl.trim().replace(/\/+$/, '');
    let endpoint = cleanBase;
    if (!endpoint.endsWith('/images/generations')) {
      if (endpoint.endsWith('/v1')) {
        endpoint = `${endpoint}/images/generations`;
      } else if (endpoint.endsWith('/v1/images')) {
        endpoint = `${endpoint}/generations`;
      } else {
        endpoint = `${endpoint}/v1/images/generations`;
      }
    }

    // Ensure we don't accidentally duplicate /v1/v1 if base URL already ends with /v1
    endpoint = endpoint.replace(/\/v1\/v1\//g, '/v1/');

    console.log('[GeminiImageProvider] Final Request URL:', endpoint);

    while (attempt < maxAttempts) {
      attempt++;
      let timeoutTimer: NodeJS.Timeout | undefined;

      try {
        const controller = new AbortController();
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutTimer = setTimeout(() => {
            controller.abort();
            reject(
              new ImageProviderError(
                504,
                'IMAGE_GENERATION_TIMEOUT',
                'Quá trình tạo ảnh mất nhiều thời gian hơn dự kiến. Bạn có thể thử lại.',
                true
              )
            );
          }, this.timeoutMs);
        });

        const requestPayload = {
          model: this.model,
          prompt: prompt,
          n: 1,
          size: '1024x1536',
          response_format: 'b64_json'
        };

        const fetchPromise = fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey.trim()}`,
            'User-Agent': 'aistudio-build'
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        });

        const response = await Promise.race([fetchPromise, timeoutPromise]);
        if (timeoutTimer) clearTimeout(timeoutTimer);

        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch {}
          const status = response.status;
          throw { status, message: errorText || `HTTP error ${status}` };
        }

        const contentType = response.headers?.get
          ? response.headers.get('content-type') || ''
          : (response.headers as any)?.['content-type'] || '';
        if (contentType.includes('text/html')) {
          throw new ImageProviderError(
            502,
            'IMAGE_PROVIDER_INVALID_RESPONSE',
            'Dịch vụ tạo ảnh trả về định dạng HTML (không phải JSON). Vui lòng kiểm tra lại cấu hình IMAGE_API_BASE_URL.',
            false
          );
        }

        const data: any = await response.json();

        let base64Data: string | null = null;
        let mimeType = 'image/png';

        const item = data?.data?.[0] || data?.[0] || data;
        if (item?.b64_json) {
          base64Data = item.b64_json;
        } else if (item?.image_base64) {
          base64Data = item.image_base64;
        } else if (data?.b64_json) {
          base64Data = data.b64_json;
        } else if (item?.url) {
          const imgRes = await fetch(item.url);
          if (imgRes.ok) {
            const buf = await imgRes.arrayBuffer();
            base64Data = Buffer.from(buf).toString('base64');
            const ct = imgRes.headers.get('content-type');
            if (ct) mimeType = ct;
          }
        }

        if (!base64Data) {
          throw new ImageProviderError(
            502,
            'IMAGE_GENERATION_FAILED',
            'Không nhận được dữ liệu base64 hình ảnh từ nhà cung cấp dịch vụ.',
            false
          );
        }

        const buffer = Buffer.from(base64Data, 'base64');
        const transformed = await transformToTrue3x4(buffer, mimeType);

        return {
          bytes: transformed.bytes,
          mimeType: transformed.mimeType,
          width: transformed.width,
          height: transformed.height
        };
      } catch (err: any) {
        if (timeoutTimer) clearTimeout(timeoutTimer);

        if (err instanceof ImageProviderError) {
          if (err.code === 'IMAGE_GENERATION_TIMEOUT' && attempt < maxAttempts) {
            console.warn(
              `[GeminiImageProvider] Timeout error (attempt ${attempt}/${maxAttempts}), retrying once...`
            );
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          throw err;
        }

        const status = err?.status || err?.statusCode || 500;
        const rawErrMsg = err?.message || String(err);
        const sanitizedErrMsg = sanitizeErrorMessage(rawErrMsg);

        console.error('[GeminiImageProvider] Generation Error:', {
          stage: 'openai_compatible_images_api',
          endpoint,
          model: this.model,
          httpStatus: status,
          errorMessageSanitized: sanitizedErrMsg
        });

        const errMsgLower = rawErrMsg.toLowerCase();

        // 1. Auth errors (401 / 403 / API Key) -> Fail fast, 0 retry
        if (
          status === 401 ||
          status === 403 ||
          errMsgLower.includes('api_key') ||
          errMsgLower.includes('api key') ||
          errMsgLower.includes('unauthorized') ||
          errMsgLower.includes('forbidden') ||
          errMsgLower.includes('permission_denied')
        ) {
          throw new ImageProviderError(
            status === 403 ? 403 : 401,
            'IMAGE_PROVIDER_AUTH_ERROR',
            'Khóa xác thực dịch vụ tạo ảnh không hợp lệ hoặc thiếu quyền truy cập.',
            false
          );
        }

        // 1.b Endpoint / Not Found errors (404) -> Fail fast, 0 retry
        if (status === 404) {
          throw new ImageProviderError(
            404,
            'IMAGE_PROVIDER_ENDPOINT_ERROR',
            'Không tìm thấy điểm cuối (endpoint) dịch vụ tạo ảnh. Vui lòng kiểm tra lại IMAGE_API_BASE_URL.',
            false
          );
        }

        // 2. Rate limit / Quota (429) -> Fail fast, 0 retry
        if (
          status === 429 ||
          errMsgLower.includes('rate limit') ||
          errMsgLower.includes('quota') ||
          errMsgLower.includes('resource_exhausted')
        ) {
          throw new ImageProviderError(
            429,
            'IMAGE_PROVIDER_RATE_LIMITED',
            'Dịch vụ tạo ảnh đang tạm thời vượt quá hạn mức sử dụng. Vui lòng thử lại sau ít phút.',
            false
          );
        }

        // 3. Timeout error
        if (
          errMsgLower.includes('timeout') ||
          errMsgLower.includes('timed out') ||
          err?.code === 'ETIMEDOUT' ||
          err?.name === 'AbortError'
        ) {
          if (attempt < maxAttempts) {
            console.warn(
              `[GeminiImageProvider] Timeout error (attempt ${attempt}/${maxAttempts}), retrying once...`
            );
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }
          throw new ImageProviderError(
            504,
            'IMAGE_GENERATION_TIMEOUT',
            'Quá trình tạo ảnh mất nhiều thời gian hơn dự kiến. Bạn có thể thử lại.',
            true
          );
        }

        // 4. Transient 5xx or Network error -> Bounded retry once
        const isTransient =
          status >= 500 ||
          errMsgLower.includes('econnreset') ||
          errMsgLower.includes('socket hang up') ||
          errMsgLower.includes('service_unavailable') ||
          errMsgLower.includes('503');

        if (isTransient && attempt < maxAttempts) {
          console.warn(
            `[GeminiImageProvider] Transient error (attempt ${attempt}/${maxAttempts}), retrying once...`,
            sanitizedErrMsg
          );
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }

        // 5. Non-transient errors
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
