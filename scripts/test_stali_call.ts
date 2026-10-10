import fetch from 'node-fetch';

async function testRaw() {
  const apiKey = process.env.IMAGE_API_KEY || '';
  const url = 'https://api.stali.vn/v1/images/generations';
  
  console.log('Posting to:', url, 'with API key length:', apiKey.length);
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'aistudio-build'
      },
      body: JSON.stringify({
        model: 'req/gemini-3.0-pro-image',
        prompt: 'A young Vietnamese male in male Áo ngũ thân tay chẽn, clean warm ivory cream studio background, soft lighting, 3:4 aspect ratio.',
        n: 1,
        size: '1024x1536',
        response_format: 'b64_json'
      })
    });
    
    console.log('HTTP Status:', res.status, res.statusText);
    const json = (await res.json()) as any;
    console.log('Response keys:', Object.keys(json));
    console.log('Full response sample:', JSON.stringify(json).slice(0, 300));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testRaw();
