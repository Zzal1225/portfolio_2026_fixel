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
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/content/site';
import '@/styles/globals.css';
import '@/styles/sprites.css';

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

// 미리보기 그림·아이콘은 파일 규칙(app/opengraph-image.png·icon.png·apple-icon.png, scripts/build-og.mjs)으로 Next가 메타를 넣는다.
// 여기서는 글과 카드 종류만 정한다. twitter 카드는 X뿐 아니라 슬랙·디스코드도 큰 그림 여부를 이 값으로 본다.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: SITE_TITLE,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
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
