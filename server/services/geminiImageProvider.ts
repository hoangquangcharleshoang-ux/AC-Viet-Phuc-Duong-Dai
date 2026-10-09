/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Image Generation Provider via Stali Image API
 *
 * Architecture:
 * - Transport: Stali Image API (POST /v1/images/generations) via native fetch
 * - Model: req/gemini-3.0-pro-image
 * - Aspect Ratio: 3:4 aspect ratio support & sharp transform
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
    const baseUrl = config?.baseUrl !== undefined ? config.baseUrl : (process.env.IMAGE_API_BASE_URL || 'https://api.stali.vn');
    const envModel = process.env.IMAGE_PROVIDER_MODEL;

    this.apiKey = apiKey || '';
    this.baseUrl = baseUrl || '';
    this.model =
      config?.model ||
      (envModel && envModel.trim().length > 0
        ? envModel.trim()
        : 'req/gemini-3.0-pro-image');

    const envTimeoutRaw = process.env.IMAGE_GENERATION_TIMEOUT_MS;
    const parsedEnvTimeout = envTimeoutRaw ? parseInt(envTimeoutRaw, 10) : 110000;
    this.timeoutMs = config?.timeoutMs || parsedEnvTimeout;

    this.apiKeyPresent = Boolean(this.apiKey && this.apiKey.trim().length > 0);
    this.baseUrlPresent = Boolean(this.baseUrl && this.baseUrl.trim().length > 0);

    if (!this.apiKeyPresent) {
      this.missingConfigMessage =
        'Dịch vụ tạo ảnh chưa được cấu hình. Vui lòng cung cấp IMAGE_API_KEY trong môi trường server.';
    }

    console.log('[GeminiImageProvider] Stali Image Gateway initialized:', {
      IMAGE_API_KEY_PRESENT: this.apiKeyPresent,
      IMAGE_API_BASE_URL: this.baseUrl,
      IMAGE_PROVIDER_MODEL: this.model,
      TIMEOUT_MS: this.timeoutMs
    });
  }

  public getModel(): string {
    return this.model;
  }

  public async generate(input: ImageGenerationInput): Promise<GeneratedImagePayload> {
    const { prompt } = input;

    if (!this.apiKeyPresent) {
      throw new ImageProviderError(
        503,
        'IMAGE_PROVIDER_NOT_CONFIGURED',
        this.missingConfigMessage || 'Dịch vụ tạo ảnh chưa được cấu hình đầy đủ.',
        false
      );
    }

    if (!this.baseUrlPresent) {
      throw new ImageProviderError(
        503,
        'IMAGE_PROVIDER_NOT_CONFIGURED',
        'Dịch vụ tạo ảnh chưa được cấu hình. Vui lòng cung cấp IMAGE_API_BASE_URL.',
        false
      );
    }

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
    endpoint = endpoint.replace(/\/v1\/v1\//g, '/v1/');

    console.log('[GeminiImageProvider] Stali Request URL:', endpoint);

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
              'Quá trình tạo ảnh mất nhiều thời gian hơn dự kiến. Vui lòng thử lại.',
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
        throw err;
      }

      const status = err?.status || err?.statusCode || 500;
      const rawErrMsg = err?.message || String(err);
      const sanitizedErrMsg = sanitizeErrorMessage(rawErrMsg);

      console.error('[GeminiImageProvider] Stali Gateway Error:', {
        endpoint,
        model: this.model,
        httpStatus: status,
        errorMessageSanitized: sanitizedErrMsg
      });

      if (status === 401) {
        throw new ImageProviderError(
          401,
          'IMAGE_PROVIDER_AUTH_ERROR',
          'Khóa API hình ảnh không hợp lệ hoặc không có quyền truy cập.',
          false
        );
      }

      throw new ImageProviderError(
        status >= 500 ? 503 : 400,
        status >= 500 ? 'IMAGE_PROVIDER_UNAVAILABLE' : 'IMAGE_GENERATION_FAILED',
        status >= 500
          ? 'Dịch vụ tạo ảnh đang tạm thời không khả dụng. Vui lòng thử lại sau.'
          : 'Yêu cầu tạo ảnh không thể hoàn tất.',
        true
      );
    }
  }
}
