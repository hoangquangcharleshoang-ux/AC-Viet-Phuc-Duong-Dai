/**
 * AC — Context-Aware Cultural Remix Co-pilot
 * Phase 2C Non-JSON 200 Regression & Routing Test
 * MOCK ONLY: ZERO LIVE GEMINI OR OPENAI CALLS.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runRegressionTest() {
  console.log('========================================================');
  console.log('RUNNING PHASE 2C NON-JSON 200 & API ROUTING REGRESSION TEST');
  console.log('MOCK MODE: ZERO LIVE GEMINI OR OPENAI CALLS');
  console.log('========================================================\n');

  const serverTs = fs.readFileSync(path.resolve(__dirname, '../server.ts'), 'utf8');
  const visualServiceTs = fs.readFileSync(path.resolve(__dirname, '../src/services/visualQAService.ts'), 'utf8');

  let passed = true;
  const checks: string[] = [];

  // Check 1: Server defines POST /api/verify-lookbook endpoint returning JSON
  const hasVerifyEndpoint = serverTs.includes("app.post('/api/verify-lookbook'");
  checks.push(`Verify-lookbook endpoint defined: ${hasVerifyEndpoint}`);
  if (!hasVerifyEndpoint) passed = false;

  // Check 2: Server defines API catch-all fallback returning JSON 404 instead of HTML index.html
  const hasApiFallback = serverTs.includes("app.all('/api/*'") && serverTs.includes("code: 'API_ENDPOINT_NOT_FOUND'");
  checks.push(`API catch-all JSON fallback defined: ${hasApiFallback}`);
  if (!hasApiFallback) passed = false;

  // Check 3: Client visualQAService checks content-type and handles non-JSON responses correctly
  const hasNonJsonGuard = visualServiceTs.includes("contentType.includes('application/json')") &&
                          visualServiceTs.includes("NON_JSON_RESPONSE") &&
                          (visualServiceTs.includes("Phản hồi máy chủ không đúng định dạng JSON") ||
                           visualServiceTs.includes("AC chưa hoàn tất được phần đánh giá này"));
  checks.push(`Client non-json guard and proper error code defined: ${hasNonJsonGuard}`);
  if (!hasNonJsonGuard) passed = false;

  // Check 4: Terminology checks across UI components
  const qaCardTs = fs.readFileSync(path.resolve(__dirname, '../src/components/CulturalQACard.tsx'), 'utf8');
  const navbarTs = fs.readFileSync(path.resolve(__dirname, '../src/components/Navbar.tsx'), 'utf8');

  const hasUpdatedTerminology1 = qaCardTs.includes('Đang đánh giá bản phối');
  const hasUpdatedTerminology2 = qaCardTs.includes('KẾT QUẢ ĐÁNH GIÁ BẢN PHỐI') || qaCardTs.includes('AC STYLIST ĐÁNH GIÁ');
  const hasUpdatedTerminology3 = qaCardTs.includes('Tinh chỉnh theo đánh giá');
  const hasUpdatedTerminology4 = navbarTs.includes('Đang đánh giá bản phối...');

  checks.push(`Terminology "Đang đánh giá bản phối" in Navbar: ${hasUpdatedTerminology4}`);
  checks.push(`Terminology "KẾT QUẢ ĐÁNH GIÁ BẢN PHỐI" in QA card: ${hasUpdatedTerminology2}`);
  checks.push(`Terminology "Tinh chỉnh theo đánh giá" in QA card: ${hasUpdatedTerminology3}`);

  if (!hasUpdatedTerminology1 || !hasUpdatedTerminology2 || !hasUpdatedTerminology3 || !hasUpdatedTerminology4) {
    passed = false;
  }

  checks.forEach((c, idx) => {
    console.log(`[Check ${idx + 1}] ${c}`);
  });

  if (passed) {
    console.log('\nREGRESSION TEST RESULT: MOCK PASS (All checks passed successfully)');
    process.exit(0);
  } else {
    console.log('\nREGRESSION TEST RESULT: FAIL');
    process.exit(1);
  }
}

runRegressionTest();
