import fs from 'fs';
import path from 'path';

const TARGET_FILES = [
  'src/components/HeroHomepage.tsx',
  'src/components/Section1Recommendation.tsx',
  'src/components/Section2Blueprint.tsx',
  'src/components/Section3Lookbook.tsx',
  'src/components/Section4Exploration.tsx',
  'src/components/CulturalQACard.tsx',
  'src/components/ACChatDrawer.tsx',
  'src/components/ResetConfirmModal.tsx',
  'src/components/IdleTimeoutWarningModal.tsx',
  'src/components/TraitTransitionsView.tsx',
  'src/components/GarmentImageRotator.tsx',
  'src/App.tsx',
];

export const CODEMOD_RULES: Array<{ name: string; regex: RegExp; replace: string }> = [
  // Page BG
  { name: 'Hardcoded Hex Page BG', regex: /bg-\[#FAF9F6\]/g, replace: 'bg-[var(--page-bg)]' },

  // Hardcoded White Backgrounds (surfaces)
  { name: 'Solid White BG', regex: /\bbg-white\b/g, replace: 'bg-[var(--surface)]' },

  // Transparent White Backgrounds (glass)
  { name: 'Glass White BG', regex: /\bbg-white\/[0-9]{2}\b/g, replace: 'bg-[var(--glass-bg)]' },

  // Hardcoded White / Light Borders
  { name: 'White Border Opacity', regex: /\bborder-white\/[0-9]{2}\b/g, replace: 'border-[var(--glass-border)]' },
  { name: 'Stone 200 Border', regex: /\bborder-stone-200(?:\/[0-9]{2})?\b/g, replace: 'border-[var(--surface-border)]' },
  { name: 'Stone 100 Border', regex: /\bborder-stone-100(?:\/[0-9]{2})?\b/g, replace: 'border-[var(--surface-border)]' },
  { name: 'Stone 300 Border', regex: /\bborder-stone-300(?:\/[0-9]{2})?\b/g, replace: 'border-[var(--surface-border)]' },

  // Text Colors
  { name: 'Primary Dark Text', regex: /\btext-stone-(?:900|800|950)\b/g, replace: 'text-[var(--text)]' },
  { name: 'Secondary Dark Text', regex: /\btext-stone-(?:700|600)\b/g, replace: 'text-[var(--text-secondary)]' },
  { name: 'Muted Dark Text', regex: /\btext-stone-(?:500|400|300)\b/g, replace: 'text-[var(--text-muted)]' },

  // Surface 2 Backgrounds (Subtle panels / cards)
  { name: 'Stone 50 BG', regex: /\bbg-stone-50(?:\/[0-9]{2})?\b/g, replace: 'bg-[var(--surface-2)]' },
  { name: 'Stone 100 BG', regex: /\bbg-stone-100(?:\/[0-9]{2})?\b/g, replace: 'bg-[var(--surface-2)]' },

  // Blue Info Pill
  { name: 'Blue Info Pill BG', regex: /\bbg-blue-(?:50|100)(?:\/[0-9]{2})?\b/g, replace: 'bg-[var(--info-pill-bg)]' },
  { name: 'Blue Info Pill Text', regex: /\btext-blue-(?:700|800|900)\b/g, replace: 'text-[var(--info-pill-text)]' },
  { name: 'Blue Info Pill Border', regex: /\bborder-blue-(?:200|300)(?:\/[0-9]{2})?\b/g, replace: 'border-[var(--info-pill-bg)]' },
];

function applyCodemod() {
  console.log('Applying Theme Codemod to target component files...\n');
  let modifiedCount = 0;

  for (const relativePath of TARGET_FILES) {
    const fullPath = path.resolve(process.cwd(), relativePath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`File not found: ${relativePath}`);
      continue;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;

    for (const rule of CODEMOD_RULES) {
      content = content.replace(rule.regex, rule.replace);
    }

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated: ${relativePath}`);
      modifiedCount++;
    } else {
      console.log(`Unchanged: ${relativePath}`);
    }
  }

  console.log(`\nCodemod completed! ${modifiedCount} file(s) updated.`);
}

applyCodemod();
