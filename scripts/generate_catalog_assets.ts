import fs from 'fs';
import path from 'path';
import { GeminiImageProvider } from '../server/services/geminiImageProvider';

async function main() {
  const provider = new GeminiImageProvider();
  console.log('[CatalogGenerator] Initializing provider with model:', provider.getModel());

  const assetsToGenerate = [
    {
      filename: 'ao-ngu-than-tay-chen-nam.png',
      prompt: 'A professional catalog-quality fashion photograph of a handsome young Vietnamese male around 22 years old with a fresh, clean-cut, photogenic appearance. He is wearing a culturally authentic Vietnamese Áo ngũ thân tay chẽn (five-panel fitted-sleeve gown) in a refined traditional silk tone. The gown features an upright Vietnamese lập lĩnh standing collar closely hugging the base of the neck, asymmetrical right-side fastening with buttons down toward the underarm, natural straight five-panel drape, and narrow fitted sleeves (trách tụ) tapering at the wrists. The background is a clean, bright, plain studio background in warm ivory cream with soft even editorial lighting. No architecture, no columns, no temple, no props, no fan, no sunglasses, no pearl accessories.'
    },
    {
      filename: 'ao-tac-nam.png',
      prompt: 'A professional catalog-quality fashion photograph of a handsome young Vietnamese male around 22 years old with a fresh, photogenic appearance. He is wearing a culturally authentic Vietnamese Áo tấc (Ngũ thân tay thụng ceremonial five-panel gown) in a refined traditional silk tone. The gown features an upright Vietnamese lập lĩnh standing collar closely hugging the base of the neck, asymmetrical right-side button fastening, spacious five-panel body, and broad rectangular untapered loose sleeves (khoan tu) falling past the hands. The background is a clean, bright, plain studio background in warm ivory cream with soft even editorial lighting. No architecture, no columns, no temple, no props, no fan, no sunglasses, no pearl accessories.'
    }
  ];

  const assetsDir = path.join(process.cwd(), 'public', 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  for (const item of assetsToGenerate) {
    const targetPath = path.join(assetsDir, item.filename);
    console.log(`[CatalogGenerator] Generating ${item.filename}...`);
    try {
      const result = await provider.generate({
        prompt: item.prompt,
        outfitFingerprint: `CATALOG-${item.filename}`
      });

      if (result.bytes && result.bytes.length > 0) {
        fs.writeFileSync(targetPath, result.bytes);
        console.log(`[CatalogGenerator] SUCCESS: Saved ${item.filename} (${result.bytes.length} bytes, ${result.width}x${result.height})`);
      } else {
        console.error(`[CatalogGenerator] ERROR: No bytes returned for ${item.filename}`);
      }
    } catch (err) {
      console.error(`[CatalogGenerator] EXCEPTION generating ${item.filename}:`, err);
    }
  }
}

main();
