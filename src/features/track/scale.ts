/**
 * 화면 크기 → 정수 배율(2·3·4).
 *
 * 규칙(11-09 D3): clamp(floor(min(w/320, h/180)), 2, 4)
 *  - 320×180은 월드(640×360)의 절반. 어떤 화면에서도 월드 4분의 1 이상이 보이게 하는 최소 창.
 *  - 정수만: 1.5배 같은 소수 배율은 1픽셀이 1.5px이 되어 줄마다 굵기가 달라진다(픽셀아트가 뭉개짐).
 *  - 하한 2: 모바일(390×844)은 계산상 1이지만 1배면 캐릭터가 32px로 너무 작다. 2배로 두고 카메라가 보완.
 *  - 상한 4: 5배 이상이면 한 화면에 보이는 트랙이 너무 좁아 걷는 의미만 남는다.
 * 버린 대안: "짧은 변 기준" — 가로 1024×세로 768(태블릿 가로)은 짧은 변 768로 4배가 되어 가로 256px만 보인다.
 */
export const MIN_SCALE = 2;
export const MAX_SCALE = 4;
const BASE_W = 320;
const BASE_H = 180;

export function computeScale(widthPx: number, heightPx: number): number {
  const raw = Math.floor(Math.min(widthPx / BASE_W, heightPx / BASE_H));
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
}

/** 인트로 한 바퀴용 절반 배율(PC·태블릿 2, 모바일 1). 평소 배율이 2면 1, 그 밖은 2 */
export function introScale(normal: number): number {
  return normal <= 2 ? 1 : 2;
}
