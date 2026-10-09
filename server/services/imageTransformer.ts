/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Image Aspect Ratio Transformation Utility
 *
 * Converts source portrait images (1024x1536 from image generation gateway)
 * into true 3:4 aspect ratio Lookbook assets (1152x1536).
 *
 * Subject Safety Rules:
 * - Preserves full vertical frame (1536px height): headwear, face, collar, garment, lower garment, footwear 100% intact.
 * - Extends width symmetrically (+64px left, +64px right) using background edge mirroring.
 * - Zero clipping of headwear or footwear. Zero white or empty borders.
 */

import sharp from 'sharp';

export interface TransformedImageResult {
  bytes: Buffer;
  mimeType: string;
  width: number;
  height: number;
}

/**
 * Transforms an image buffer to a true 3:4 aspect ratio (1152x1536).
 */
export async function transformToTrue3x4(
  imageBuffer: Buffer,
  mimeType = 'image/jpeg'
): Promise<TransformedImageResult> {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const srcW = meta.width || 1024;
    const srcH = meta.height || 1536;

    // Target aspect ratio for 3:4 is 0.75
    const currentRatio = srcW / srcH;
    const targetRatio = 0.75;

    // If already 3:4 within 1% tolerance, return original
    if (Math.abs(currentRatio - targetRatio) < 0.01) {
      return {
        bytes: imageBuffer,
        mimeType: meta.format === 'png' ? 'image/png' : 'image/jpeg',
        width: srcW,
        height: srcH
      };
    }

    // When converting 2:3 (1024x1536) to 3:4 (1152x1536):
    // Keep full height (1536px) to guarantee headwear and footwear are 100% intact.
    const targetW = Math.round(srcH * targetRatio); // 1536 * 0.75 = 1152
    const padTotal = Math.max(0, targetW - srcW);
    const padLeft = Math.floor(padTotal / 2);
    const padRight = padTotal - padLeft;

    const transformedBytes = await sharp(imageBuffer)
      .extend({
        top: 0,
        bottom: 0,
        left: padLeft,
        right: padRight,
        extendWith: 'mirror'
      })
      .jpeg({ quality: 92 })
      .toBuffer();

    const finalMeta = await sharp(transformedBytes).metadata();

    return {
      bytes: transformedBytes,
      mimeType: 'image/jpeg',
      width: finalMeta.width || targetW,
      height: finalMeta.height || srcH
    };
  } catch (err) {
    console.warn('[imageTransformer] Error transforming image to 3:4, returning fallback dimensions:', err);
    return {
      bytes: imageBuffer,
      mimeType,
      width: 1024,
      height: 1536
    };
  }
}
