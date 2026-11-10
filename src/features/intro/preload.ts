/**
 * 인트로 프리로드: 실제 완료를 기다린다(가짜 대기 금지, CLAUDE.md 2장).
 *  - 폰트: document.fonts.ready + 전광판 문구용 Galmuri를 명시적으로 load(preload: false라 아직 안 받았을 수 있음)
 *  - 그림: new Image().decode() — 내려받기뿐 아니라 디코딩까지 끝나야 첫 프레임에 빈칸이 안 생긴다
 * 실패(네트워크 오류)는 무시하고 진행한다: 그림 하나 때문에 사이트에 못 들어가면 안 된다.
 * <link rel="preload">는 Game.tsx에서 react-dom의 preload()로 건다(HTML head에 들어감).
 */
export const PRELOAD_IMAGES = [
  '/sprites/character/runner-sheet-128x240.png',
  '/sprites/character/runner-idle-64x192.png',
  '/sprites/world/track-ring-512x232.png',
  '/sprites/tiles/tile-grass-32x32.png',
  '/sprites/tiles/tile-stand-32x32.png',
  // 구조물·신호등·심판·이정표는 물건 시트 한 장, 키캡은 UI 시트(scripts/build-sheets.mjs)
  '/sprites/sheets/objects-227x195.png',
  '/sprites/sheets/ui-33x16.png',
  // 반응 구역 말풍선 조각(border-image라 시트에 못 넣음). 처음 구역에 들어설 때 빈 판이 보이지 않게 미리 디코딩
  '/sprites/ui/alert-body-14x11.png',
  '/sprites/ui/alert-tail-5x3.png',
  // 인트로 큰 전광판은 빈 전광판 그림을 늘려 쓴다(시트에 넣지 않음)
  '/sprites/structures/scoreboard-blank-96x32.png',
] as const;

/** HTML 단계에서 <link rel=preload>로 먼저 받을 그림: 첫 화면에 크게 보이는 것만(나머지까지 걸면 서로 대역폭을 다툼) */
export const CRITICAL_IMAGES = [
  '/sprites/world/track-ring-512x232.png',
  '/sprites/tiles/tile-grass-32x32.png',
  '/sprites/tiles/tile-stand-32x32.png',
  '/sprites/character/runner-sheet-128x240.png',
  '/sprites/sheets/objects-227x195.png',
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
