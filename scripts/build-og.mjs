// 링크 미리보기 이미지(opengraph-image.png 1200×630)와 사이트 아이콘(icon.png·apple-icon.png)을 굽는다.
//
// 왜 Next 파일 규칙(src/app/opengraph-image.png, icon.png, apple-icon.png)인가:
//   파일만 두면 Next가 <meta property="og:image">·<link rel="icon">을 크기·타입과 함께 넣어 준다. 메타를 손으로 쓰면 크기가 어긋나기 쉽다.
// 왜 미리 굽는가(버린 대안: opengraph-image.tsx + ImageResponse): 런타임에 그리면 서버리스 함수가 하나 늘고,
//   satori는 픽셀 그림 확대(image-rendering: pixelated)를 지원하지 않아 그림이 뭉개진다. 정적 PNG면 CDN에서 바로 나간다.
// 그림은 전부 시안(design/)에서: 월드 전경 2배 + 손 흔드는 러너 4배 + 실제 사이트와 같은 로고(Press Start 2P, 테두리 그림자).
// 로고는 창과 같은 흰 9-slice 판 위에: 월드 위에 바로 얹으면 천막·관중석과 겹쳐 작은 미리보기에서 읽히지 않는다.
// 러너는 아치 위 인필드(발이 아치 윗변보다 위): 겹치면 아치에 올라탄 것처럼 보인다.
// 글꼴이 필요해서 로고는 브라우저(Playwright, 이미 E2E용 devDependency)로 그린다. 그림·글꼴은 data URI로 넣어 file:// 제약을 피한다.
// 실행: node scripts/build-og.mjs
import fs from 'node:fs';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const A = 'design/design_handoff_track_portfolio/assets';
const uri = (f, type) => `data:${type};base64,${fs.readFileSync(f).toString('base64')}`;
const INK = '#1e2638';
const ACCENT = '#f5c431';
const GRASS = '#6fb24b';

// ---- 미리보기 1200×630: 월드(640×360)를 2배 = 1280×720에서 잘라낸다
const W = 1200,
  H = 630;
const OFF = { x: 40, y: 50 }; // 2배 월드에서 자를 위치(관중석 위쪽 줄을 조금 덜어 로고 자리를 만든다)
// 손 흔들기 2프레임 중 팔을 든 칸(5행 2번째, 32×48), 4배
const wave = { sx: 32, sy: 192 };
const outline = (n) =>
  [
    [n, 0],
    [-n, 0],
    [0, n],
    [0, -n],
    [n, n],
    [-n, n],
    [n, -n],
    [-n, -n],
  ]
    .map(([x, y]) => `${x}px ${y}px 0 ${INK}`)
    .join(',');

const html = `<!doctype html><html><head><style>
@font-face { font-family: P; src: url(${uri('src/app/fonts/PressStart2P-Regular.woff2', 'font/woff2')}); }
* { margin: 0; }
body { width: ${W}px; height: ${H}px; overflow: hidden; position: relative; image-rendering: pixelated; }
.world { position: absolute; left: ${-OFF.x}px; top: ${-OFF.y}px; width: 1280px; height: 720px;
  background: url(${uri(`${A}/world/world-640x360-no-runner.png`, 'image/png')}) 0 0 / 1280px 720px; }
.runner { position: absolute; left: 536px; top: 214px; width: 128px; height: 192px;
  background: url(${uri(`${A}/character/runner-sheet-128x240.png`, 'image/png')}) ${-wave.sx * 4}px ${-wave.sy * 4}px / 512px 960px; }
.logo { position: absolute; left: 40px; top: 36px; padding: 28px 32px 30px; font-family: P; line-height: 1;
  display: flex; flex-direction: column; gap: 22px;
  border: 8px solid transparent; border-image: url(${uri('public/sprites/ui/nine-white-24.svg', 'image/svg+xml')}) 8 fill / 8px; }
.name { font-size: 64px; color: #fff; text-shadow: ${outline(5)}, 0 12px 0 ${INK}; }
.sub { font-size: 26px; color: ${ACCENT}; letter-spacing: 5px; text-shadow: ${outline(4)}; }
</style></head><body>
<div class="world"></div><div class="runner"></div>
<p class="logo"><span class="name">ChanRyeong</span><span class="sub">PORTFOLIO</span></p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'src/app/opengraph-image.png' });
await browser.close();
// 스크린샷 PNG는 무압축에 가깝다 → 팔레트 PNG로(픽셀 그림이라 색이 적어 손실 없음에 가깝다)
const og = await sharp('src/app/opengraph-image.png').png({ palette: true, colors: 64 }).toBuffer();
fs.writeFileSync('src/app/opengraph-image.png', og);
console.log(`opengraph-image.png: ${(og.length / 1024).toFixed(1)}KB`);

// ---- 아이콘: 러너 정면 첫 칸의 위 32×32(머리·어깨)를 잔디색 바탕에. 정수 배율(nearest)로만 키운다
const face = await sharp(`${A}/character/runner-sheet-128x240.png`)
  .extract({ left: 0, top: 6, width: 32, height: 32 })
  .toBuffer();
async function icon(size, out) {
  const k = size / 32;
  const big = await sharp(face).resize(size, size, { kernel: 'nearest' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: GRASS } })
    .composite([{ input: big }])
    .png({ palette: true })
    .toFile(out);
  console.log(`${out}: ${size}×${size} (${k}배)`);
}
await icon(64, 'src/app/icon.png'); // 탭 아이콘: 브라우저가 16·32로 줄인다
await icon(192, 'src/app/apple-icon.png'); // 홈 화면 추가(iOS)
