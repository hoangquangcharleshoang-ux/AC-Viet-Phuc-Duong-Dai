/**
 * AC — Theme WCAG Contrast Test
 * Computes WCAG relative luminance and contrast ratio for every text-on-surface token pair
 * in both Light and Dark themes.
 */

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): ColorRGB {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function parseColor(colorStr: string, bgContext: string = '#FFFFFF'): ColorRGB {
  if (colorStr.startsWith('#')) {
    return hexToRgb(colorStr);
  }
  const rgbaMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
  if (rgbaMatch) {
    const fgR = parseInt(rgbaMatch[1], 10);
    const fgG = parseInt(rgbaMatch[2], 10);
    const fgB = parseInt(rgbaMatch[3], 10);
    const alpha = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;

    if (alpha >= 1) {
      return { r: fgR, g: fgG, b: fgB };
    }

    const bgRgb = parseColor(bgContext);
    return {
      r: Math.round(fgR * alpha + bgRgb.r * (1 - alpha)),
      g: Math.round(fgG * alpha + bgRgb.g * (1 - alpha)),
      b: Math.round(fgB * alpha + bgRgb.b * (1 - alpha)),
    };
  }
  throw new Error(`Unsupported color format: ${colorStr}`);
}

function getLuminance({ r, g, b }: ColorRGB): number {
  const [aR, aG, aB] = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * aR + 0.7152 * aG + 0.0722 * aB;
}

function getContrastRatio(fgStr: string, bgStr: string, parentBgStr?: string): number {
  const bgRgb = parseColor(bgStr, parentBgStr);
  const fgRgb = parseColor(fgStr, bgStr);

  const L1 = getLuminance(fgRgb);
  const L2 = getLuminance(bgRgb);

  const brighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);

  return (brighter + 0.05) / (darker + 0.05);
}

interface PairTest {
  name: string;
  fgKey: string;
  bgKey: string;
  minThreshold: number;
}

const TOKEN_PAIRS: PairTest[] = [
  { name: 'Text on Page BG', fgKey: 'text', bgKey: 'page-bg', minThreshold: 4.5 },
  { name: 'Text on Surface', fgKey: 'text', bgKey: 'surface', minThreshold: 4.5 },
  { name: 'Text Secondary on Surface', fgKey: 'text-secondary', bgKey: 'surface', minThreshold: 4.5 },
  { name: 'Text Muted on Surface', fgKey: 'text-muted', bgKey: 'surface', minThreshold: 3.5 },
  { name: 'Text on Surface-2', fgKey: 'text', bgKey: 'surface-2', minThreshold: 4.5 },
  { name: 'Text Secondary on Surface-2', fgKey: 'text-secondary', bgKey: 'surface-2', minThreshold: 4.5 },
  { name: 'Chip Text on Chip BG', fgKey: 'chip-text', bgKey: 'chip-bg', minThreshold: 4.5 },
  { name: 'Chip Selected Text on Selected BG', fgKey: 'chip-selected-text', bgKey: 'chip-selected-bg', minThreshold: 4.5 },
  { name: 'Info Pill Text on Info Pill BG', fgKey: 'info-pill-text', bgKey: 'info-pill-bg', minThreshold: 4.5 },
  { name: 'Pass Text on Pass BG', fgKey: 'pass-text', bgKey: 'pass-bg', minThreshold: 4.5 },
  { name: 'Warn Text on Warn BG', fgKey: 'warn-text', bgKey: 'warn-bg', minThreshold: 4.5 },
  { name: 'Fail Text on Fail BG', fgKey: 'fail-text', bgKey: 'fail-bg', minThreshold: 4.5 },
  { name: 'Accent Text on Surface', fgKey: 'accent', bgKey: 'surface', minThreshold: 3.5 },
  { name: 'Button Contrast Text on Primary BG', fgKey: 'accent-contrast', bgKey: 'primary-button-bg', minThreshold: 4.5 },
];

export const LIGHT_THEME: Record<string, string> = {
  'page-bg': '#FAF9F6',
  'surface': '#FFFFFF',
  'surface-2': '#F5F4F0',
  'surface-border': '#E7E5E4',
  'text': '#242321',
  'text-secondary': '#44403C',
  'text-muted': '#6B6560',
  'chip-bg': '#F5F4F0',
  'chip-border': '#E7E5E4',
  'chip-text': '#44403C',
  'chip-selected-bg': '#FEF3C7',
  'chip-selected-border': '#F59E0B',
  'chip-selected-text': '#78350F',
  'info-pill-bg': '#E0EDFF',
  'info-pill-text': '#1E40AF',
  'pass-bg': '#ECFDF5',
  'pass-text': '#065F46',
  'warn-bg': '#FFFBEB',
  'warn-text': '#92400E',
  'fail-bg': '#FEF2F2',
  'fail-text': '#991B1B',
  'accent': '#B45309',
  'accent-contrast': '#FFFFFF',
  'primary-button-bg': '#A85507',
};

export const DARK_THEME: Record<string, string> = {
  'page-bg': '#0B0A08',
  'surface': '#17140F',
  'surface-2': '#211D16',
  'surface-border': '#4A4339',
  'text': '#FFFFFF',
  'text-secondary': '#E3DCCF',
  'text-muted': '#BDB4A5',
  'chip-bg': '#1C1812',
  'chip-border': '#6A6155',
  'chip-text': '#EDE6DA',
  'chip-selected-bg': '#3B2610',
  'chip-selected-border': '#F5A94F',
  'chip-selected-text': '#FFE2B0',
  'info-pill-bg': '#1B2A44',
  'info-pill-text': '#B8D2FF',
  'pass-bg': '#16382B',
  'pass-text': '#A7F3D0',
  'warn-bg': '#3B2B10',
  'warn-text': '#FDE68A',
  'fail-bg': '#3D1B1C',
  'fail-text': '#FCA5A5',
  'accent': '#F5A94F',
  'accent-contrast': '#FFFFFF',
  'primary-button-bg': '#B35A08',
};

export function runContrastSuite() {
  console.log('================================================================================================');
  console.log('AC THEME WCAG CONTRAST VERIFICATION');
  console.log('================================================================================================\n');

  let totalFailed = 0;

  console.log('LIGHT THEME RESULTS:');
  console.log('------------------------------------------------------------------------------------------------');
  console.log('| Pair Name                             | FG Color | BG Color | Ratio   | Threshold | Status  |');
  console.log('------------------------------------------------------------------------------------------------');

  for (const test of TOKEN_PAIRS) {
    const fg = LIGHT_THEME[test.fgKey];
    const bg = LIGHT_THEME[test.bgKey];
    const ratio = getContrastRatio(fg, bg, LIGHT_THEME['surface']);
    const passed = ratio >= test.minThreshold;
    if (!passed) totalFailed++;

    const ratioStr = ratio.toFixed(2) + ':1';
    const status = passed ? 'PASS' : 'FAIL';

    console.log(
      `| ${test.name.padEnd(37)} | ${fg.padEnd(8)} | ${bg.padEnd(8)} | ${ratioStr.padEnd(7)} | ${test.minThreshold.toFixed(1).padEnd(9)} | ${status.padEnd(7)} |`
    );
  }
  console.log('------------------------------------------------------------------------------------------------\n');

  console.log('DARK THEME RESULTS:');
  console.log('------------------------------------------------------------------------------------------------');
  console.log('| Pair Name                             | FG Color | BG Color | Ratio   | Threshold | Status  |');
  console.log('------------------------------------------------------------------------------------------------');

  for (const test of TOKEN_PAIRS) {
    const fg = DARK_THEME[test.fgKey];
    const bg = DARK_THEME[test.bgKey];
    const ratio = getContrastRatio(fg, bg, DARK_THEME['surface']);
    const passed = ratio >= test.minThreshold;
    if (!passed) totalFailed++;

    const ratioStr = ratio.toFixed(2) + ':1';
    const status = passed ? 'PASS' : 'FAIL';

    console.log(
      `| ${test.name.padEnd(37)} | ${fg.padEnd(8)} | ${bg.padEnd(8)} | ${ratioStr.padEnd(7)} | ${test.minThreshold.toFixed(1).padEnd(9)} | ${status.padEnd(7)} |`
    );
  }
  console.log('------------------------------------------------------------------------------------------------\n');

  if (totalFailed > 0) {
    console.error(`❌ FAILURE: ${totalFailed} contrast pair(s) failed WCAG standards!`);
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: All token contrast ratios pass WCAG standards!');
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('theme_contrast_test')) {
  runContrastSuite();
}
