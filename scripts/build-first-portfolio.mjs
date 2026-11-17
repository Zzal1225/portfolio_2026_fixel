// ABOUT ME 창 "첫 포트폴리오" 칸의 영상과 첫 장면 그림을 만든다: 당시 사이트 첫 화면을 열어 약 8초 녹화한다.
//
// 왜 영상인가(11-13 사용자 요청): 그 사이트는 움직임(물결·홍학·글자 등장)이 특징이라 멈춘 그림으로는 전해지지 않는다.
// 왜 스크립트인가: 손으로 녹화하면 크기·길이·화질이 매번 달라진다. 주소만 있으면 같은 결과가 다시 나온다.
// 왜 1280×720인가: 그 사이트는 데스크톱 전용이다. 좁게 찍으면 배치가 깨진 화면이 찍힌다.
//
// 만드는 것:
//   public/video/first-portfolio.webm   소리 없는 영상(Playwright 녹화기 = VP8 WebM. 오디오 트랙 자체가 없다)
//   public/img/first-portfolio-poster.webp  영상이 뜨기 전·움직임 줄이기 설정에서 보이는 첫 장면(960w)
//   public/video/first-portfolio.mp4    같은 영상의 H.264 판(사파리용, 창은 이것을 먼저 고른다). PATH에 ffmpeg가 있을 때만 만든다
// 왜 따로 굽나: Playwright에 든 ffmpeg는 WebM만 굽는다. 이미 있는 WebM만 MP4로 바꾸려면(다시 녹화하지 않고):
//   ffmpeg -y -i public/video/first-portfolio.webm -an -c:v libx264 -crf 27 -pix_fmt yuv420p -movflags +faststart public/video/first-portfolio.mp4
//
// 함정 1: 들어가면 안내 팝업(뒤집히는 카드)이 화면을 덮는다. 녹화는 페이지가 만들어질 때부터 시작되므로 눌러서 닫으면 그 장면이 영상에 들어간다
//         → 팝업을 CSS로 숨긴 채 연다.
// 함정 2: 첫 방문은 파일을 받느라 앞부분이 흰 화면이다 → 같은 컨텍스트에서 한 번 미리 열어 캐시를 데운 뒤 녹화용 페이지를 연다.
// 실행: node scripts/build-first-portfolio.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const URL = 'https://ryeong-portfolio.netlify.app/';
const SIZE = { width: 1280, height: 720 };
const SECONDS = 8;
const TMP = 'private/img/first-portfolio-rec';
const VIDEO = 'public/video/first-portfolio.webm';
const POSTER = 'public/img/first-portfolio-poster.webp';
const HIDE_POPUP = '.flip-card { display: none !important; }';

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(path.dirname(VIDEO), { recursive: true });

const browser = await chromium.launch();
// 녹화 크기는 화면보다 작게(800×450): 창 안 표시 폭이 약 600px이고, 1280×720 그대로 굽으면 10초에 5MB가 넘는다
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: TMP, size: { width: 800, height: 450 } },
});
await context.addInitScript((css) => {
  const add = () => {
    const style = document.createElement('style');
    style.textContent = css;
    document.documentElement.append(style);
  };
  if (document.documentElement) add();
  else document.addEventListener('DOMContentLoaded', add);
}, HIDE_POPUP);

// 캐시 데우기(이 페이지의 녹화 파일은 버린다)
const warm = await context.newPage();
await warm.goto(URL, { waitUntil: 'networkidle' });
await warm.close();

const page = await context.newPage();
// 함정 3: load 이벤트를 기다리면 배경 음악 파일까지 받느라 10초 넘게 걸리고 그동안도 녹화된다(영상이 21초가 됐다) → 문서가 오기 시작하면 바로 센다
await page.goto(URL, { waitUntil: 'commit' });
await page.waitForTimeout(SECONDS * 1000);
// 첫 장면 그림: 등장 애니메이션이 끝난 뒤의 화면
await page.screenshot({ path: `${TMP}/poster.png` });
const recorded = await page.video().path();
await context.close(); // 닫아야 영상 파일이 완성된다
await browser.close();

fs.copyFileSync(recorded, VIDEO);
const poster = await sharp(`${TMP}/poster.png`)
  .resize({ width: 960 })
  .webp({ quality: 80 })
  .toFile(POSTER);
console.log(`${VIDEO}: ${(fs.statSync(VIDEO).size / 1024).toFixed(0)}KB`);
console.log(`${POSTER}: ${poster.width}×${poster.height}, ${(poster.size / 1024).toFixed(1)}KB`);

// ffmpeg가 있으면 MP4도: 녹화 크기 그대로(키우면 용량만 는다), 소리 없음(-an), 웹에서 바로 재생되게 moov를 앞으로(+faststart)
if (spawnSync('ffmpeg', ['-version']).status === 0) {
  const mp4 = VIDEO.replace(/\.webm$/, '.mp4');
  execFileSync('ffmpeg', [
    '-y',
    '-i',
    VIDEO,
    '-an',
    '-c:v',
    'libx264',
    '-crf',
    '27',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    mp4,
  ]);
  console.log(`${mp4}: ${(fs.statSync(mp4).size / 1024).toFixed(0)}KB`);
} else {
  console.log('ffmpeg가 없어 MP4는 만들지 않았다(WebM만).');
}
