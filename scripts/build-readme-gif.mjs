// README 맨 위 GIF를 만든다: 신호등 → 한 바퀴 → 인사 → 메뉴 클릭 → 달려가 창이 열림(CLAUDE.md 5-3).
//
// 왜 스크립트인가: 손으로 녹화하면 크기·길이·누르는 때가 매번 다르다. 사이트가 바뀌면 이 파일만 다시 돌리면 된다.
// 왜 배포 주소인가: 로컬 서버를 띄우지 않아도 되고, README를 보는 사람이 들어갈 바로 그 화면이다.
//   다른 주소로 찍으려면: SITE_URL=http://localhost:3000 node scripts/build-readme-gif.mjs
// 왜 GIF인가: GitHub README는 저장소 안 영상 파일을 재생하지 않는다(그림만 보인다). 도트 그림은 색이 적어 GIF로도 작다.
// 왜 빠르게 감나: 인트로만 14.3초라 창이 열릴 때까지 약 20초다. 15초에 맞춰 전체를 같은 비율로 당긴다(일부만 자르면 흐름이 끊긴다).
//
// 만드는 것: docs/assets/readme-intro.gif (640×360, 10fps). 필요: PATH의 ffmpeg(Playwright에 든 것은 WebM만 굽는다).
// 함정 1: 첫 방문은 그림·폰트를 받느라 로딩 덮개가 길다 → 같은 컨텍스트에서 한 번 미리 열어 캐시를 데운다.
// 함정 2: 녹화는 페이지가 만들어질 때 시작된다. 주소로 가기 전 빈 화면이 앞에 붙으므로 그만큼(-ss) 잘라 낸다.
// 함정 3: GIF는 256색이다. 장면마다 색을 다시 고르면 깜빡이므로 영상 전체에서 팔레트 하나를 뽑아(palettegen) 쓴다.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const URL = process.env.SITE_URL ?? 'https://portfolio2026fixel.vercel.app/';
const SIZE = { width: 1280, height: 720 }; // PC 배율 4. 월드 640×360이 화면에 꽉 찬다
const OUT_SIZE = { width: 640, height: 360 }; // 도트 1칸 = 2px
const TARGET_SECONDS = 15;
const FPS = 10;
const TMP = 'private/img/readme-gif-rec';
const OUT = 'docs/assets/readme-intro.gif';

if (spawnSync('ffmpeg', ['-version']).status !== 0) {
  console.error('ffmpeg가 PATH에 없다. 설치: winget install Gyan.FFmpeg');
  process.exit(1);
}

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: TMP, size: SIZE },
});

const warm = await context.newPage();
await warm.goto(URL, { waitUntil: 'networkidle' });
await warm.close();

const page = await context.newPage();
const created = Date.now();
await page.goto(URL, { waitUntil: 'commit' });
const lead = (Date.now() - created) / 1000; // 빈 화면 구간
// 인트로가 끝나면 메뉴가 나타난다(인트로 중에는 HUD가 없다)
const menu = page.getByRole('navigation', { name: 'Menu' });
await menu.waitFor({ state: 'visible', timeout: 40_000 });
await page.waitForTimeout(1200); // HUD 등장 연출이 끝나고 키캡 안내가 한 번 보이도록
await menu.getByRole('button', { name: 'Open CAREER' }).click();
await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 20_000 });
await page.waitForTimeout(2000); // 열린 창을 읽을 시간
const total = (Date.now() - created) / 1000;
const recorded = await page.video().path();
await context.close(); // 닫아야 영상 파일이 완성된다
await browser.close();

const length = total - lead;
const speed = Math.max(1, length / TARGET_SECONDS);
// 왜 neighbor: 절반으로 줄일 때 도트 경계가 번지지 않게. 왜 dither=none: 평평한 색 면에 점이 생기면 용량이 는다
const filter =
  `setpts=PTS/${speed.toFixed(3)},fps=${FPS},scale=${OUT_SIZE.width}:${OUT_SIZE.height}:flags=neighbor,` +
  `split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=none`;
execFileSync(
  'ffmpeg',
  ['-y', '-v', 'error', '-ss', lead.toFixed(2), '-i', recorded, '-filter_complex', filter, OUT],
  { stdio: 'inherit' },
);
console.log(
  `${OUT}: ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB, 원본 ${length.toFixed(1)}초 → ${(length / speed).toFixed(1)}초(${speed.toFixed(2)}배)`,
);
