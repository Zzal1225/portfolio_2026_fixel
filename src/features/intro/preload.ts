/**
 * 인트로 프리로드: 실제 완료를 기다린다(가짜 대기 금지, CLAUDE.md 2장).
 *  - 폰트: document.fonts.ready + 전광판 문구용 Galmuri를 명시적으로 load(preload: false라 아직 안 받았을 수 있음)
 *  - 그림: new Image().decode() — 내려받기뿐 아니라 디코딩까지 끝나야 첫 프레임에 빈칸이 안 생긴다
 * 실패(네트워크 오류)는 무시하고 진행한다: 그림 하나 때문에 사이트에 못 들어가면 안 된다.
 * <link rel="preload">는 Game.tsx에서 react-dom의 preload()로 건다(HTML head에 들어감).
 */
export const PRELOAD_IMAGES = [
  '/sprites/character/runner-sheet-128x240.png',
  '/sprites/world/track-ring-512x232.png',
  '/sprites/tiles/tile-grass-32x32.png',
  '/sprites/tiles/tile-stand-32x32.png',
  '/sprites/structures/arch-96x64.png',
  '/sprites/structures/scoreboard-blank-96x32.png',
  '/sprites/structures/water-a-64x32.png',
  '/sprites/structures/water-b-64x32.png',
  '/sprites/structures/tent-64x64.png',
  '/sprites/structures/reception-table-64x32.png',
  '/sprites/intro/signal-red-32x64.png',
  '/sprites/intro/signal-yellow-32x64.png',
  '/sprites/intro/signal-green-32x64.png',
  '/sprites/intro/referee-flag-up-32x48.png',
  '/sprites/intro/referee-flag-down-32x48.png',
] as const;

function decodeImage(src: string): Promise<void> {
  const img = new Image();
  img.src = src;
  return img.decode().catch(() => undefined);
}

export async function preloadAssets(): Promise<void> {
  const fonts = document.fonts;
  const galmuri = getComputedStyle(document.documentElement).getPropertyValue('--font-galmuri');
  await Promise.all([
    fonts?.ready,
    galmuri ? fonts?.load(`700 16px ${galmuri}`).catch(() => undefined) : undefined,
    ...PRELOAD_IMAGES.map(decodeImage),
  ]);
}
