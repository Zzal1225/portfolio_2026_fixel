/**
 * 트랙 경로: t(0 이상 1 미만) ↔ 월드 픽셀, 진행 방향 계산.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ 이 파일의 본문은 사용자가 직접 작성한다(CLAUDE.md 5-1).           │
 * │ Claude는 시그니처·테스트(trackPath.test.ts)·힌트만 둔다.          │
 * │ 안내: private/learning/00-roadmap.md "직접 짤 파일 1"             │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * 다 짰으면 아래 TRACK_PATH_READY를 true로 바꾼다.
 * 그 순간 trackPath.test.ts가 켜지고, 화면의 러너도 자리표시 대신 진짜 좌표로 움직인다.
 *
 * 규칙(테스트가 확인하는 것):
 *  - 순수 함수만. React·store·DOM을 import하지 않는다.
 *  - 트랙 상수는 layout.ts의 TRACK에서 읽는다(숫자를 여기 다시 적지 않기).
 *  - t 단위와 s(px) 단위를 섞지 않는다. 바깥으로 나가는 값은 전부 t 단위(좌표 제외).
 */
import type { Point } from './layout';
// import { TRACK } from './layout';   // ← 구현할 때 주석 해제

export type Direction = 'ccw' | 'cw';
export type Facing = 'left' | 'right' | 'up' | 'down';
export type KeyAxis = -1 | 0 | 1;

/** 구현을 마치면 true. 테스트와 화면이 이 값을 보고 자리표시를 끈다 */
export const TRACK_PATH_READY = false;

/** 0 이상 1 미만으로 감는다. wrapT(1) = 0, wrapT(-0.25) = 0.75 */
export function wrapT(t: number): number {
  void t;
  return 0; // TODO(사용자)
}

/**
 * t → 달리는 선 위의 점(x, y)과 발 위치 y(footY = y + 12).
 * t=0 은 (320, 280), 화면상 반시계(아래 직선에서 오른쪽)로 증가.
 */
export function toWorld(t: number): Point & { footY: number } {
  void t;
  return { x: 320, y: 280, footY: 292 }; // TODO(사용자): 지금은 항상 출발선(자리표시)
}

/** t 지점에서 ccw 진행 방향의 단위 벡터(화면 좌표, y는 아래로 +) */
export function tangent(t: number): Point {
  void t;
  return { x: 1, y: 0 }; // TODO(사용자)
}

/** 스프라이트 행 고르기: 진행 방향 벡터의 x·y 중 큰 쪽 */
export function facing(t: number, dir: Direction): Facing {
  void t;
  return dir === 'ccw' ? 'right' : 'left'; // TODO(사용자)
}

/**
 * from → to 로 가는 부호 있는 최단 거리(t 단위). 범위 (−0.5, 0.5].
 * 양수 = ccw로 가는 게 가깝다. 정반대(차이 0.5)는 +0.5(ccw)로 정한다.
 */
export function signedDistance(from: number, to: number): number {
  void from;
  void to;
  return 0; // TODO(사용자)
}

/** 메뉴·미니맵 자동 이동 방향. signedDistance의 부호(0이면 'ccw') */
export function shortestDirection(from: number, to: number): Direction {
  void from;
  void to;
  return 'ccw'; // TODO(사용자)
}

/**
 * 네 방향 키 → 트랙 진행 방향(B안).
 * (dx, dy)와 tangent(t)의 내적이 +면 'ccw', −면 'cw', 거의 0(|내적| < 0.2)이면 null(멈춤).
 * 키를 두 개 누르면 합 벡터를 정규화한 뒤 내적한다.
 */
export function keyToDirection(t: number, dx: KeyAxis, dy: KeyAxis): Direction | null {
  void t;
  void dx;
  void dy;
  return null; // TODO(사용자)
}
