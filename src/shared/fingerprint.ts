/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Canonical Outfit Fingerprint Generator (Shared Contract Client & Server)
 *
 * Requirements:
 * - Represents current effective outfit state
 * - Includes: garmentId, cohesive palette with roles, fabricId, lowerGarmentId, footwearId, ACTIVE accessoryIds, context
 * - Excludes: modelId, timestamps, UI state, generationId
 */

export interface FingerprintInput {
  garmentId: string;
  palette: Array<{ id: string; role?: string }>;
  fabricId: string;
  lowerGarmentId: string;
  footwearId: string;
  accessoryIds: string[];
  contextProps?: Array<{
    type?: string;
    description?: string;
    source?: string;
    contextFit?: string;
  }>;
  occasion?: string;
  style?: string;
  traditionalRatio?: number;
  genderPresentation?: string;
}

export function canonicalizeContextProp(prop: {
  type?: string;
  description?: string;
  source?: string;
  contextFit?: string;
}): string {
  const type = (prop.type || 'handheld').trim().toLowerCase();
  const desc = (prop.description || '').trim().replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').toLowerCase();
  const source = (prop.source || 'explicit_user_request').trim().toLowerCase();
  const fit = (prop.contextFit || 'appropriate').trim().toLowerCase();
  return `${type}:${desc}:${source}:${fit}`;
}

export function computeOutfitFingerprint(input: FingerprintInput): string {
  const paletteKey = (input.palette || [])
    .map(p => `${(p.id || '').trim().toLowerCase()}:${(p.role || 'PRIMARY').trim().toUpperCase()}`)
    .join('-');

  const accStr = (input.accessoryIds || [])
    .map(a => a.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join(',');

  const propStr = (input.contextProps || [])
    .filter(p => p && p.description && p.description.trim().length > 0)
    .map(canonicalizeContextProp)
    .sort()
    .join(',');

  const occ = (input.occasion || '').trim().toLowerCase();
  const sty = (input.style || '').trim().toLowerCase();
  const ratio = typeof input.traditionalRatio === 'number' ? input.traditionalRatio : '';
  const gender = (input.genderPresentation || 'nam').trim().toLowerCase();
  const garment = (input.garmentId || '').trim().toLowerCase();
  const fabric = (input.fabricId || '').trim().toLowerCase();
  const lower = (input.lowerGarmentId || '').trim().toLowerCase();
  const footwear = (input.footwearId || '').trim().toLowerCase();

  const payload = `${garment}|${occ}|${sty}|${ratio}|${gender}|${paletteKey}|${fabric}|${lower}|${footwear}|${accStr}|${propStr}`;

  let hashVal = 5381;
  for (let i = 0; i < payload.length; i++) {
    hashVal = (hashVal * 33) ^ payload.charCodeAt(i);
  }
  const hex = (hashVal >>> 0).toString(16).toUpperCase().padStart(8, '0');
  const gPrefix = (garment || 'GAR').toUpperCase().slice(0, 3);
  return `AC-${gPrefix}-${hex}`;
}
