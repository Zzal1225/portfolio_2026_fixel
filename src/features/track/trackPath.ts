/**
 * 트랙 경로: t(0 이상 1 미만) ↔ 월드 픽셀, 진행 방향 계산. 순수 함수만(React·store·DOM 없음).
 *
 * 트랙은 스타디움형(직선 2 + 반원 2)이라 네 구간 모두 닫힌 식으로 풀린다. 점 근사(폴리라인)를 쓰지 않은 이유:
 *  - 꼭짓점마다 접선이 꺾여 스프라이트 방향이 깜빡이고,
 *  - 최단 거리·방향이 세그먼트 탐색이 되며,
 *  - 미니맵 SVG(직선 + 호)와 좌표가 미세하게 어긋난다.
 *
 * 좌표계: 화면 y는 아래로 +. s = t × 둘레(px). s=0은 아래 직선 x=320(출발선)이고, s가 커지면 화면상 반시계
 * (아래 직선 → 오른쪽 반원 위로 → 위 직선 왼쪽으로 → 왼쪽 반원 아래로).
 *
 * 구간(s, px):  아래 직선 오른쪽 절반 [0, 140) → 오른쪽 반원 [140, 454.16) → 위 직선 [454.16, 734.16)
 *               → 왼쪽 반원 [734.16, 1048.32) → 아래 직선 왼쪽 절반 [1048.32, 1188.32)
 * 테스트: trackPath.test.ts(구간 경계·반원 한가운데·감기·수치 미분과 접선 비교).
 */
import { TRACK, type Point } from './layout';

export type Direction = 'ccw' | 'cw';
export type Facing = 'left' | 'right' | 'up' | 'down';
/** 방향키 한 축(useRunner 입력) */
export type KeyAxis = -1 | 0 | 1;

const R = TRACK.laneRadius;
const HALF_CIRCLE = Math.PI * R;
const A = TRACK.centerLeft;
const B = TRACK.centerRight;
/** 출발선에서 오른쪽 반원 시작까지 */
const FIRST = B.x - TRACK.startX; // 140
const S_RIGHT_END = FIRST + HALF_CIRCLE;
const S_TOP_END = S_RIGHT_END + TRACK.straight;
const S_LEFT_END = S_TOP_END + HALF_CIRCLE;

/**
 * 0 이상 1 미만으로 감는다. JS의 %는 음수에서 음수를 돌려주므로 한 번 더 더해 나눈다.
 * 부동소수 때문에 1이 나오는 경우(아주 작은 음수)는 0으로.
 */
export function wrapT(t: number): number {
  const v = ((t % 1) + 1) % 1;
  return v >= 1 ? 0 : v;
}

/** 한 지점의 좌표와 ccw 접선. toWorld·tangent가 같은 분기를 쓰도록 한 곳에 둔다 */
function sample(t: number): { p: Point; v: Point } {
  const s = wrapT(t) * TRACK.length;
  if (s < FIRST) {
    return { p: { x: TRACK.startX + s, y: A.y + R }, v: { x: 1, y: 0 } };
  }
  if (s < S_RIGHT_END) {
    // 오른쪽 반원: 각도 π/2(아래)에서 시작해 화면상 위로 돈다 → 각도가 줄어든다
    const th = Math.PI / 2 - (s - FIRST) / R;
    return {
      p: { x: B.x + R * Math.cos(th), y: B.y + R * Math.sin(th) },
      v: { x: Math.sin(th), y: -Math.cos(th) },
    };
  }
  if (s < S_TOP_END) {
    return { p: { x: B.x - (s - S_RIGHT_END), y: A.y - R }, v: { x: -1, y: 0 } };
  }
  if (s < S_LEFT_END) {
    // 왼쪽 반원: 각도 −π/2(위)에서 시작해 화면상 아래로
    const th = -Math.PI / 2 - (s - S_TOP_END) / R;
    return {
      p: { x: A.x + R * Math.cos(th), y: A.y + R * Math.sin(th) },
      v: { x: Math.sin(th), y: -Math.cos(th) },
    };
  }
  return { p: { x: A.x + (s - S_LEFT_END), y: A.y + R }, v: { x: 1, y: 0 } };
}

/** t → 달리는 선 위의 점(x, y)과 발 위치 y(footY = y + 12) */
export function toWorld(t: number): Point & { footY: number } {
  const { p } = sample(t);
  return { x: p.x, y: p.y, footY: p.y + TRACK.footOffsetY };
}

/** t 지점에서 ccw 진행 방향의 단위 벡터 */
export function tangent(t: number): Point {
  return sample(t).v;
}

/** 스프라이트 행: 진행 방향 벡터에서 x·y 중 큰 쪽(같으면 가로) */
export function facing(t: number, dir: Direction): Facing {
  const v = tangent(t);
  const x = dir === 'ccw' ? v.x : -v.x;
  const y = dir === 'ccw' ? v.y : -v.y;
  if (Math.abs(x) >= Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
}

/**
 * from → to 부호 있는 최단 거리(t 단위), 범위 (−0.5, 0.5].
 * 정반대(0.5)는 +0.5(ccw)로 고정한다. 범위 한쪽을 닫아 두지 않으면 자동 이동이 정반대 지점에서
 * 틱마다 방향을 바꿔 제자리에서 떨 수 있다.
 */
export function signedDistance(from: number, to: number): number {
  const d = wrapT(to - from);
  return d > 0.5 ? d - 1 : d;
}

export function shortestDirection(from: number, to: number): Direction {
  return signedDistance(from, to) >= 0 ? 'ccw' : 'cw';
}

/**
 * 월드 좌표 → 가장 가까운 레인 지점의 트랙 거리 s(px, 0 이상 둘레 미만). toWorld의 역방향.
 * 자유 이동(11-10 시안 채택)에서 메뉴 자동 이동이 "가까운 레인 지점 → 레인 따라 → 목표" 경로를 짤 때 쓴다.
 * 직선 구간은 x로, 반원 구간은 중심에서 본 각도로 정한다(시안 trackParam과 같은 식).
 */
export function nearestS(x: number, y: number): number {
  const L = TRACK.length;
  let s: number;
  if (x >= A.x && x <= B.x) {
    if (y >= A.y) s = x >= TRACK.startX ? x - TRACK.startX : L - (TRACK.startX - x);
    else s = S_RIGHT_END + (B.x - x);
  } else if (x > B.x) {
    const th = Math.atan2(y - B.y, x - B.x); // 아래 π/2 → 위 −π/2
    s = FIRST + (Math.PI / 2 - th) * R;
  } else {
    const th = Math.atan2(y - A.y, x - A.x); // 위 −π/2 → 왼쪽 ±π → 아래 π/2
    const phi = th < 0 ? -th : 2 * Math.PI - th; // 위 π/2 → 왼쪽 π → 아래 3π/2
    s = S_TOP_END + (phi - Math.PI / 2) * R;
  }
  return ((s % L) + L) % L;
}
