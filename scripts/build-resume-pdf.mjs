// 이력서 PDF를 굽는다: /resume/print 페이지 → public/resume.pdf (A4). RESUME 창의 "PDF로 받기"가 이 파일을 내려준다.
//
// 왜 브라우저로 인쇄하나: 웹 이력서와 같은 컴포넌트·같은 글꼴로 찍혀서 모양이 똑같다. 이미 테스트에 쓰는 Playwright(크로미움)라 새 의존성이 없다.
// 함정:
//  - 글꼴·사진이 다 온 뒤에 찍어야 한다(document.fonts.ready + 이미지 decode). 아니면 대체 글꼴로 찍힌다.
//  - 배경색(남색 띠)은 printBackground를 켜야 나온다.
//  - 사진은 srcset이라 deviceScaleFactor 2로 열어 큰 파일(750w)을 고르게 한다(인쇄는 화면보다 선명해야 한다).
//  - 서버가 꺼져 있으면 접속 거부(ERR_CONNECTION_REFUSED)로 끝났다(11-12 사용자 제보). 그래서 서버가 없으면
//    이 스크립트가 개발 서버를 다른 포트(3123)로 잠깐 띄워서 찍고 끈다. 이미 떠 있으면(npm run dev) 그 서버를 그대로 쓴다.
//
// 실행: node scripts/build-resume-pdf.mjs [주소, 기본 http://localhost:3000]
import { spawn, spawnSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const OUT = 'public/resume.pdf';
const TEMP_PORT = 3123;

const reachable = async (url) => {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
};

/** 개발 서버를 띄우고 /resume/print가 응답할 때까지 기다린다(첫 컴파일이 수십 초 걸릴 수 있다) */
async function startTempServer() {
  console.log(`서버가 꺼져 있어 개발 서버를 잠깐 띄웁니다(포트 ${TEMP_PORT})...`);
  // 명령을 한 문자열로(shell에 인자 배열을 넘기면 Node가 DEP0190 경고를 낸다)
  const child = spawn(`npx next dev --port ${TEMP_PORT}`, {
    shell: true,
    stdio: 'ignore',
    detached: process.platform !== 'win32',
  });
  const url = `http://localhost:${TEMP_PORT}`;
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (await reachable(`${url}/resume/print`)) return { url, child };
    await new Promise((r) => setTimeout(r, 1000));
  }
  stopServer(child);
  throw new Error('개발 서버가 2분 안에 뜨지 않았습니다');
}

/** shell로 띄운 npx → next 자식까지 같이 끈다(부모만 끄면 next가 포트를 잡은 채 남는다) */
function stopServer(child) {
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
  else process.kill(-child.pid);
}

const given = process.argv[2];
let base = given ?? 'http://localhost:3000';
let temp = null;
if (!(await reachable(`${base}/resume/print`))) {
  if (given) throw new Error(`${given} 에 접속할 수 없습니다`);
  temp = await startTempServer();
  base = temp.url;
}

try {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 794, height: 1123 },
    deviceScaleFactor: 2,
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const res = await page.goto(`${base}/resume/print`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });
  if (!res?.ok()) throw new Error(`/resume/print 응답 ${res?.status()}`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((img) => img.decode().catch(() => {})));
  });
  await page.pdf({ path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  console.log(`${OUT} 저장`);
} finally {
  if (temp) stopServer(temp.child);
}
