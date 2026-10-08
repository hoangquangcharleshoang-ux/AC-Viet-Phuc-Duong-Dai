/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2B: Image Provider Abstraction Interface
 */

export interface ImageGenerationInput {
  prompt: string;
  outfitFingerprint: string;
  orientation?: 'PORTRAIT_LOOKBOOK';
}

export interface GeneratedImagePayload {
  bytes: Buffer;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface ImageProvider {
  generate(input: ImageGenerationInput): Promise<GeneratedImagePayload>;
}

export class ImageProviderError extends Error {
  status: number;
  code: string;
  retryable: boolean;

  constructor(status: number, code: string, message: string, retryable = false) {
    super(message);
    this.name = 'ImageProviderError';
    this.status = status;
    this.code = code;
    this.retryable = retryable;
  }
}
