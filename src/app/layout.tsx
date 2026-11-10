// 왜 next/font/local: 폰트를 외부 CDN에서 받으면 첫 화면이 다른 도메인 연결을 기다린다.
// self-host하면 같은 도메인에서 오고, next/font가 크기 보정(size-adjust)까지 해 줘 글자가 늦게 바뀌어도 레이아웃이 덜 흔들린다.
//
// 어떤 폰트를 미리 불러오나(preload):
//   - Press Start 2P(12KB): HUD·메뉴·구조물 이름. 첫 화면에 바로 보이므로 preload.
//   - Galmuri11 Bold(166KB): 인트로 전광판 문구·이정표. 인트로 프리로드(document.fonts.ready)가 기다리므로 preload는 끔.
//   - Pretendard 서브셋(각 ~270KB): 창 본문. 창을 열기 전엔 필요 없어 preload 끔.
//   버린 대안: Pretendard 가변 폰트 한 파일(2MB), Galmuri11 Regular(500KB) — 시안이 쓰지 않는 굵기라 제외.
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import '@/styles/globals.css';

const pressStart = localFont({
  src: './fonts/PressStart2P-Regular.woff2',
  variable: '--font-press-start',
  display: 'swap',
});

const galmuri = localFont({
  src: './fonts/Galmuri11-Bold.woff2',
  variable: '--font-galmuri',
  weight: '700',
  display: 'swap',
  preload: false,
});

const pretendard = localFont({
  src: [
    { path: './fonts/Pretendard-Regular.subset.woff2', weight: '400' },
    { path: './fonts/Pretendard-Bold.subset.woff2', weight: '700' },
  ],
  variable: '--font-pretendard',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: '박찬령 포트폴리오',
  description: '400m 트랙을 달리며 보는 프론트엔드 개발자 박찬령의 포트폴리오',
};

export const viewport: Viewport = {
  themeColor: '#6fb24b',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ko" className={`${pressStart.variable} ${galmuri.variable} ${pretendard.variable}`}>
      <body>{children}</body>
    </html>
  );
}
