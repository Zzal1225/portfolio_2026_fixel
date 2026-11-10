// 인트로 구간별 프레임 측정(특히 11-10 시안 채택으로 생긴 소수 배율 줌인·줌아웃).
//
// 방법: Playwright 크로미움, 새 컨텍스트(introSeen 없음 = 첫 방문). 페이지가 열리자마자 rAF로 모든 프레임 시각을 기록하고
// (측정용 스크립트일 뿐, 앱에는 rAF 루프 없음), "ON YOUR MARKS" 띠가 처음 보인 순간을 인트로 0초로 잡는다.
// 시안 타임라인(timeline.ts T) 구간마다 fps(초당 프레임)와 가장 긴 프레임 간격(ms)을 낸다. Layout 횟수는 CDP 전체 합계.
//
// 실행: node scripts/measure-intro.mjs [URL=https://portfolio2026fixel.vercel.app/]
import { chromium } from '@playwright/test';

const URL = process.argv[2] ?? 'https://portfolio2026fixel.vercel.app/';
const SEGMENTS = [
  ['신호등 0–1.8s', 0, 1.8],
  ['한 바퀴 1.8–10.0s', 1.8, 10.0],
  ['줌인 10.0–10.8s', 10.0, 10.8],
  ['인사 10.8–13.6s', 10.8, 13.6],
  ['줌아웃 13.6–14.3s', 13.6, 14.3],
];

const browser = await chromium.launch();
const rows = [];
for (const [label, viewport] of [
  ['PC 1280×720', { width: 1280, height: 720 }],
  ['모바일 390×844', { width: 390, height: 844 }],
]) {
  for (const cpu of [1, 4]) {
    const ctx = await browser.newContext({ viewport });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.addInitScript(() => {
      const w = window;
      w.__frames = [];
      w.__introStart = null;
      const f = (t) => {
        w.__frames.push(t);
        if (w.__introStart === null && document.body?.innerText.includes('ON YOUR MARKS')) {
          w.__introStart = t;
        }
        requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
    await page.goto(URL);
    const before = Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    );
    await page.waitForFunction(() => window.__introStart !== null, null, { timeout: 20000 });
    await page.waitForTimeout(15000);
    const after = Object.fromEntries(
      (await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]),
    );
    const { frames, start } = await page.evaluate(() => ({
      frames: window.__frames,
      start: window.__introStart,
    }));
    for (const [seg, a, b] of SEGMENTS) {
      const fs = frames.filter((t) => t >= start + a * 1000 && t < start + b * 1000);
      let maxGap = 0;
      for (let i = 1; i < fs.length; i++) maxGap = Math.max(maxGap, fs[i] - fs[i - 1]);
      rows.push({
        조건: `${label} · CPU ${cpu}×`,
        구간: seg,
        fps: Math.round(fs.length / (b - a)),
        '최장 프레임(ms)': Math.round(maxGap),
      });
    }
    rows.push({
      조건: `${label} · CPU ${cpu}×`,
      구간: '인트로 전체 Layout 횟수',
      fps: '',
      '최장 프레임(ms)': after.LayoutCount - before.LayoutCount,
    });
    await ctx.close();
  }
}
await browser.close();
console.table(rows);
console.log(JSON.stringify(rows));
