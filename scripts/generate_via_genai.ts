import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

async function generateWithGenAI() {
  const apiKey = process.env.CUSTOM_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No Gemini API key found');
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  console.log('GoogleGenAI initialized');

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
    console.log(`Generating ${item.filename} via Imagen / Gemini...`);
    try {
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: item.prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '3:4',
        },
      });

      const image = response.generatedImages?.[0];
      if (image?.image?.imageBytes) {
        const buffer = Buffer.from(image.image.imageBytes, 'base64');
        const targetPath = path.join(assetsDir, item.filename);
        fs.writeFileSync(targetPath, buffer);
        console.log(`Saved ${item.filename} (${buffer.length} bytes)`);
      } else {
        console.error(`No imageBytes returned for ${item.filename}`);
      }
    } catch (err: any) {
      console.error(`Failed to generate ${item.filename}:`, err?.message || err);
    }
  }
}

generateWithGenAI();
