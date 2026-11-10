// 달리기·카메라 이동 중 레이아웃·스타일 재계산 횟수 측정(CLAUDE.md 성능 목표: 이동 중 Layout 0회).
//
// 방법: Playwright(크로미움) + CDP Performance.getMetrics. 인트로를 건너뛴 뒤
//   1) → 를 3초 누르고 있을 때, 2) 메뉴로 반대편 구조물까지 자동 이동할 때
// 전후 LayoutCount·RecalcStyleCount·TaskDuration 차이를 잰다. CPU 4배 느리게(저사양 모바일 흉내).
// 프레임: requestAnimationFrame으로 측정 구간의 프레임 수만 센다(측정용, 앱에는 rAF 루프 없음).
//
// 실행: npm run build && node scripts/measure-run.mjs [포트=3400]
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = Number(process.argv[2] ?? 3400);
const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
  shell: true,
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 4000));

const browser = await chromium.launch();
const results = [];
try {
  for (const [label, viewport] of [
    ['PC 1280×720', { width: 1280, height: 720 }],
    ['모바일 390×844', { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Performance.enable');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.goto(`http://localhost:${PORT}/`);
    await page.getByRole('button', { name: 'Skip intro' }).click();
    await page.getByRole('navigation', { name: 'Menu' }).waitFor();
    await page.waitForTimeout(800);

    const metrics = async () => {
      const { metrics: m } = await cdp.send('Performance.getMetrics');
      return Object.fromEntries(m.map((x) => [x.name, x.value]));
    };
    const countFrames = (ms) =>
      page.evaluate(
        (ms) =>
          new Promise((resolve) => {
            let n = 0;
            const end = performance.now() + ms;
            const f = () => {
              n++;
              if (performance.now() < end) requestAnimationFrame(f);
              else resolve(n);
            };
            requestAnimationFrame(f);
          }),
        ms,
      );

    const measure = async (name, action, ms) => {
      const a = await metrics();
      const [frames] = await Promise.all([countFrames(ms), action()]);
      const b = await metrics();
      results.push({
        조건: label,
        구간: name,
        'Layout 횟수': b.LayoutCount - a.LayoutCount,
        'Recalc Style 횟수': b.RecalcStyleCount - a.RecalcStyleCount,
        '메인 스레드 작업(ms)': Math.round((b.TaskDuration - a.TaskDuration) * 1000),
        'fps(rAF)': Math.round((frames / ms) * 1000),
      });
    };

    await measure(
      '→ 3초 달리기',
      async () => {
        await page.keyboard.down('ArrowRight');
        await page.waitForTimeout(3000);
        await page.keyboard.up('ArrowRight');
      },
      3000,
    );
    await page.waitForTimeout(500);
    const menuButton = page.getByRole('navigation', { name: 'Menu' }).getByRole('button', {
      name: 'Open SKILL',
    });
    await measure('메뉴 자동 이동(SKILL)', () => menuButton.click(), 3000);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
  if (process.platform === 'win32') spawn('taskkill', ['/pid', String(server.pid), '/T', '/F']);
}
console.table(results);
console.log(JSON.stringify(results));
