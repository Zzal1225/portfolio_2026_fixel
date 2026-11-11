// 인트로 움직임 측정: 프레임(rAF)마다 월드 transform과 흑백 부채꼴 각도를 기록해 "매끄러운가"를 숫자로 본다.
// 왜 프레임 단위인가: 평균 fps는 60이어도 값이 60ms마다 계단으로 바뀌면 눈에는 끊겨 보인다. 그래서 "값이 실제로 바뀐 횟수"와
//                    "프레임당 변화량의 들쭉날쭉함"을 잰다. rAF는 측정 페이지에서만 쓴다(제품 코드 아님).
// 실행: npm run build && npx next start -p 3100 후 node scripts/measure-intro-smooth.mjs [URL]
import { chromium } from '@playwright/test';

const URL_ = process.argv[2] ?? 'http://localhost:3100';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(URL_);
const frames = await p.evaluate(
  () =>
    new Promise((resolve) => {
      const out = [];
      const t0 = performance.now();
      const world = document.querySelector('[data-world]');
      const step = () => {
        const m = new DOMMatrix(getComputedStyle(world).transform);
        const g = [...document.querySelectorAll('div[aria-hidden]')].find((d) =>
          d.style.maskImage?.includes('conic'),
        );
        const cs = g ? parseFloat(getComputedStyle(g).getPropertyValue('--sweep')) : null;
        out.push({ t: (performance.now() - t0) / 1000, s: m.a, x: m.e, y: m.f, gray: cs });
        if (performance.now() - t0 < 16000) requestAnimationFrame(step);
        else resolve(out);
      };
      requestAnimationFrame(step);
    }),
);
await b.close();

const stat = (name, arr) => {
  const d = arr.filter((v) => v > 1e-6);
  if (!d.length) return console.log(name, '변화 없음');
  const m = d.reduce((a, c) => a + c, 0) / d.length;
  const sd = Math.sqrt(d.reduce((a, c) => a + (c - m) ** 2, 0) / d.length);
  console.log(
    `${name}: 바뀐 프레임 ${d.length}/${arr.length}, 프레임당 평균 ${m.toFixed(4)}, 들쭉날쭉(CV) ${(sd / m).toFixed(2)}, 최대 ${Math.max(...d).toFixed(3)}`,
  );
};
const dif = (fs, k) => fs.slice(1).map((f, i) => Math.abs(f[k] - fs[i][k]));
console.log(
  '총 프레임',
  frames.length,
  '평균 간격 ms',
  (((frames.at(-1).t - frames[0].t) / frames.length) * 1000).toFixed(1),
);

const sw = frames.filter((f) => f.gray !== null);
console.log(`부채꼴 구간 ${sw[0]?.t.toFixed(2)}~${sw.at(-1)?.t.toFixed(2)}s`);
const swGray = sw.map((f) => f.gray);
const changes = swGray.slice(1).filter((v, i) => v !== swGray[i]).length;
console.log(`부채꼴 각도 값이 바뀐 횟수 ${changes} / 프레임 ${sw.length}`);
let back = 0;
for (let i = 1; i < swGray.length; i++) if (swGray[i] < swGray[i - 1] - 0.01) back++;
console.log(
  '각도가 거꾸로 간 횟수',
  back,
  '최소 gray',
  Math.min(...swGray),
  '최대 gray',
  Math.max(...swGray),
);
const big = swGray
  .slice(1)
  .map((v, i) => Math.abs(v - swGray[i]))
  .sort((a, c) => c - a)
  .slice(0, 3);
console.log('한 번에 가장 크게 뛴 각도', big.map((v) => v.toFixed(1)).join(', '));

// 줌: 스케일이 움직이는 구간 자동 탐색
const dS = dif(frames, 's');
const moving = frames.map((f, i) => (i && dS[i - 1] > 1e-5 ? i : -1)).filter((i) => i >= 0);
const segs = [];
for (const i of moving) {
  const last = segs.at(-1);
  if (last && i - last[1] <= 8) last[1] = i;
  else segs.push([i, i]);
}
for (const [a, c] of segs) {
  const seg = frames.slice(a, c + 1);
  console.log(
    `\n줌 구간 ${frames[a].t.toFixed(2)}~${frames[c].t.toFixed(2)}s 배율 ${frames[a].s.toFixed(2)}→${frames[c].s.toFixed(2)}`,
  );
  stat(' 배율', dif(seg, 's'));
  stat(' 카메라x(화면px)', dif(seg, 'x'));
  stat(' 카메라y(화면px)', dif(seg, 'y'));
  // 등가속 곡선에서 벗어난 "2차 차분": 곡선이 매끄러우면 작다
  const ds = dif(seg, 's');
  const acc = ds.slice(1).map((v, i) => Math.abs(v - ds[i]));
  console.log(
    ` 배율 변화량의 급변(2차 차분) 최대 ${Math.max(...acc).toFixed(4)}, 평균 ${(acc.reduce((a2, c2) => a2 + c2, 0) / acc.length).toFixed(4)}`,
  );
}
