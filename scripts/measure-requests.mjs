// 첫 화면 그림 요청 수·전송량 측정(시트 합치기 전후 비교용, docs/performance.md 4장).
// 첫 방문(인트로 포함) 페이지를 열고 네트워크가 잠잠해질 때까지 + SKIP 후 3초, 그림(image) 요청만 센다.
// 실행: npm run build && node scripts/measure-requests.mjs [URL=http://localhost:3400/] (서버는 따로 띄운다)
import { chromium } from '@playwright/test';

const URL = process.argv[2] ?? 'http://localhost:3400/';
const browser = await chromium.launch();
for (const [label, viewport] of [
  ['PC 1280×720', { width: 1280, height: 720 }],
  ['모바일 390×844', { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const images = new Map();
  page.on('response', async (res) => {
    if (res.request().resourceType() !== 'image') return;
    const body = await res.body().catch(() => Buffer.alloc(0));
    images.set(res.url(), body.length);
  });
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Skip intro' }).click();
  await page.waitForTimeout(3000);
  const total = [...images.values()].reduce((a, b) => a + b, 0);
  console.log(`${label}: 그림 요청 ${images.size}개, ${(total / 1024).toFixed(1)} KB`);
  await ctx.close();
}
await browser.close();
