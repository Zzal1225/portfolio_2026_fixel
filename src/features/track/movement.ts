/**
 * 자유 이동(11-10 시안 채택): 잔디·인필드 어디든 8방향으로 달리고, 구조물·관중석에는 막힌다. 순수 함수만.
 *
 * 숫자는 Design 핸드오프 README "2. Play"와 같다:
 *  - 속도 110 월드px/s(대각선 정규화), 발 범위 x 10–630, y 48–358
 *  - 충돌: 구조물(아치 제외)·신호등·심판·이정표 사각형을 좌우 8, 위 2, 아래 3px 넓힌 칸 + 관중석 전체
 *    (발 좌우 ±6px, 발 위 6px까지 검사). 축별로 따로 판정해 벽을 따라 미끄러진다.
 *  - 반응 구역: 구조물 사각형 사방 20px(아래 22px) ∪ 앞 지점 ±14px. 여러 개면 구조물 가운데가 가까운 것.
 *  - 자동 이동(메뉴·지도·구조물 클릭): 앞 지점까지 90px 이내면 직선, 아니면 가까운 레인 지점 → 레인 따라 → (천막만) 앞 지점.
 *
 * 왜 레인을 따라가나: 직선으로 가면 구조물·관중석에 걸린다. 경로 탐색(A*)을 넣는 대신 "트랙은 늘 비어 있다"를 이용한다.
 * 버린 대안: 트랙 위 t 하나로만 움직이기(11-09 B안) — 시안의 자유 이동으로 결정이 바뀌었다(design-vs-plan #7).
 */
import {
  ACTORS,
  LANDMARKS,
  SIGNPOST,
  STANDS,
  TRACK,
  rectFromAnchor,
  rectFromTopLeft,
  type Landmark,
  type LandmarkId,
  type Point,
  type Rect,
} from './layout';
import { facing as laneFacing, nearestS, signedDistance, toWorld } from './trackPath';
import type { Facing } from './trackPath';

export const SPEED_PX_S = 110;
export const BOUNDS = { x0: 10, x1: 630, y0: 48, y1: 358 } as const;
/** 앞 지점까지 이 거리 안이면 레인을 거치지 않고 직선으로 */
export const DIRECT_RANGE = 90;

const inRect = (r: Rect, x: number, y: number) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
const grow = (r: Rect): Rect => ({ x0: r.x0 - 8, x1: r.x1 + 8, y0: r.y0 - 2, y1: r.y1 + 3 });

/** 발이 들어갈 수 없는 칸. 아치는 통과(러너가 아치 아래로 지나간다) */
export const SOLIDS: readonly Rect[] = [
  ...LANDMARKS.filter((l) => l.id !== 'about').map((l) => grow(rectFromAnchor(l.anchor, l.size))),
  ...ACTORS.map((a) => grow(rectFromAnchor(a.anchor, a.size))),
  grow(rectFromTopLeft(SIGNPOST.topLeft, SIGNPOST.size)),
];

const inStand = (x: number, y: number) =>
  STANDS.some((s) => inRect(s, Math.round(x), Math.round(y)));

/** 발 위치(x, y)에 설 수 있나 */
export function blocked(x: number, y: number): boolean {
  if (SOLIDS.some((b) => inRect(b, x, y))) return true;
  return [x - 6, x, x + 6].some((px) => inStand(px, y)) || inStand(x, y - 6);
}

/** 입력 벡터 → 바라보는 방향(가로가 같거나 크면 가로) */
export function facingOf(vx: number, vy: number): Facing {
  if (Math.abs(vx) >= Math.abs(vy)) return vx > 0 ? 'right' : 'left';
  return vy > 0 ? 'down' : 'up';
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * 한 틱 자유 이동. 대각선은 정규화(√2배 빠르지 않게), 축별 판정으로 벽을 따라 미끄러진다.
 * @returns 새 위치와 실제로 움직였는지
 */
export function stepFree(
  pos: Point,
  dx: number,
  dy: number,
  step: number,
): { pos: Point; moved: boolean } {
  const len = Math.hypot(dx, dy);
  if (len === 0) return { pos, moved: false };
  const nx = clamp(pos.x + (dx / len) * step, BOUNDS.x0, BOUNDS.x1);
  const ny = clamp(pos.y + (dy / len) * step, BOUNDS.y0, BOUNDS.y1);
  let { x, y } = pos;
  if (!blocked(nx, y)) x = nx;
  if (!blocked(x, ny)) y = ny;
  return { pos: { x, y }, moved: x !== pos.x || y !== pos.y };
}

const byId = (id: LandmarkId): Landmark => {
  const l = LANDMARKS.find((x) => x.id === id);
  if (!l) throw new Error(id);
  return l;
};

/** 레인 위 트랙 거리 s의 발 위치 */
export function lanePoint(s: number): Point {
  const p = toWorld(s / TRACK.length);
  return { x: p.x, y: p.footY };
}

/** 자동 이동이 멈추는 앞 지점 */
export function frontPoint(id: LandmarkId): Point {
  const l = byId(id);
  return l.front ?? lanePoint(l.s);
}

/** 반응 구역 사각형 */
export function zoneRect(id: LandmarkId): Rect {
  const l = byId(id);
  const r = rectFromAnchor(l.anchor, l.size);
  const f = frontPoint(id);
  return {
    x0: Math.min(r.x0 - 20, f.x - 14),
    x1: Math.max(r.x1 + 20, f.x + 14),
    y0: Math.min(r.y0 - 20, f.y - 14),
    y1: Math.max(r.y1 + 22, f.y + 14),
  };
}

const ZONES = LANDMARKS.map((l) => {
  const r = rectFromAnchor(l.anchor, l.size);
  return { id: l.id, zone: zoneRect(l.id), cx: (r.x0 + r.x1) / 2, cy: (r.y0 + r.y1) / 2 };
});

/** 발 위치가 어느 반응 구역 안인가(겹치면 구조물 가운데가 가까운 쪽) */
export function zoneAt(pos: Point): LandmarkId | null {
  let best: LandmarkId | null = null;
  let bestD = Infinity;
  for (const z of ZONES) {
    if (!inRect(z.zone, pos.x, pos.y)) continue;
    const d = Math.hypot(pos.x - z.cx, pos.y - z.cy);
    if (d < bestD) {
      bestD = d;
      best = z.id;
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// 자동 이동 경로
// ---------------------------------------------------------------------------

export type Leg = { kind: 'point'; to: Point } | { kind: 'lane'; s: number; to: number };

/** 현재 위치 → 구조물 앞 지점까지의 경로 */
export function planRoute(pos: Point, id: LandmarkId): Leg[] {
  const front = frontPoint(id);
  if (Math.hypot(pos.x - front.x, pos.y - front.y) < DIRECT_RANGE)
    return [{ kind: 'point', to: front }];
  const L = TRACK.length;
  const s0 = nearestS(pos.x, pos.y);
  const target = byId(id).s;
  const legs: Leg[] = [
    { kind: 'point', to: lanePoint(s0) },
    { kind: 'lane', s: s0, to: s0 + signedDistance(s0 / L, target / L) * L },
  ];
  if (byId(id).front) legs.push({ kind: 'point', to: front });
  return legs;
}

/**
 * 경로를 한 틱(step px)만큼 진행. 남은 경로가 없으면 done.
 * 한 틱에 다리(leg) 하나만 끝낸다(남은 거리를 다음 다리로 넘기지 않음): 단순하고, 꺾이는 지점에서 한 틱 쉬어도 눈에 띄지 않는다.
 */
export function stepRoute(
  pos: Point,
  legs: readonly Leg[],
  step: number,
): { pos: Point; legs: Leg[]; facing: Facing | null; done: boolean } {
  const [leg, ...rest] = legs;
  if (!leg) return { pos, legs: [], facing: null, done: true };
  if (leg.kind === 'point') {
    const dx = leg.to.x - pos.x;
    const dy = leg.to.y - pos.y;
    const d = Math.hypot(dx, dy);
    if (d <= step)
      return {
        pos: leg.to,
        legs: rest,
        facing: d > 0 ? facingOf(dx, dy) : null,
        done: rest.length === 0,
      };
    return {
      pos: { x: pos.x + (dx / d) * step, y: pos.y + (dy / d) * step },
      legs: [leg, ...rest],
      facing: facingOf(dx, dy),
      done: false,
    };
  }
  const remaining = leg.to - leg.s;
  const dir = remaining >= 0 ? 'ccw' : 'cw';
  const L = TRACK.length;
  if (Math.abs(remaining) <= step) {
    return {
      pos: lanePoint(leg.to),
      legs: rest,
      facing: laneFacing(leg.to / L, dir),
      done: rest.length === 0,
    };
  }
  const s = leg.s + Math.sign(remaining) * step;
  return {
    pos: lanePoint(s),
    legs: [{ kind: 'lane', s, to: leg.to }, ...rest],
    facing: laneFacing(s / L, dir),
    done: false,
  };
}

/** 트랙 순서(s)로 다음·이전 구조물(모바일 ◀ ▶, 시안) */
export function neighborStation(pos: Point, zone: LandmarkId | null, delta: 1 | -1): LandmarkId {
  const order = [...LANDMARKS].sort((a, b) => a.s - b.s);
  const cur = zone ? byId(zone).s : nearestS(pos.x, pos.y);
  if (delta > 0) return (order.find((l) => l.s > cur + 4) ?? order[0]!).id;
  return ([...order].reverse().find((l) => l.s < cur - 4) ?? order[order.length - 1]!).id;
}
