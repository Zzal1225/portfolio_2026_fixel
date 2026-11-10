import { describe, expect, it } from 'vitest';
import { LANDMARKS, TRACK, rectFromAnchor } from './layout';
import {
  BOUNDS,
  DIRECT_RANGE,
  blocked,
  facingOf,
  frontPoint,
  lanePoint,
  neighborStation,
  planRoute,
  stepFree,
  stepRoute,
  zoneAt,
  type Leg,
} from './movement';

const START = lanePoint(0); // 출발선 레인 (320, 292)

describe('blocked', () => {
  it('트랙 레인·잔디는 다닐 수 있다', () => {
    expect(blocked(START.x, START.y)).toBe(false);
    expect(blocked(320, 200)).toBe(false); // 인필드
  });
  it('아치 아래는 지나갈 수 있다(유일하게 통과하는 구조물)', () => {
    expect(blocked(320, 290)).toBe(false);
  });
  it('구조물·관중석에는 들어갈 수 없다', () => {
    const table = LANDMARKS.find((l) => l.id === 'resume')!;
    const r = rectFromAnchor(table.anchor, table.size);
    expect(blocked((r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2)).toBe(true);
    expect(blocked(320, 20)).toBe(true); // 위 관중석
    expect(blocked(615, 200)).toBe(true); // 오른쪽 관중석
  });
});

describe('stepFree', () => {
  it('대각선은 정규화된다(한 틱 이동 거리 = step)', () => {
    const r = stepFree({ x: 320, y: 200 }, 1, 1, 6);
    expect(Math.hypot(r.pos.x - 320, r.pos.y - 200)).toBeCloseTo(6, 6);
  });
  it('벽에 막혀도 다른 축으로는 미끄러진다', () => {
    // 위 관중석(y<32)에 바로 붙은 곳에서 ↖: 위는 막히고 왼쪽으로만
    const r = stepFree({ x: 300, y: BOUNDS.y0 }, -1, -1, 6);
    expect(r.pos.y).toBe(BOUNDS.y0);
    expect(r.pos.x).toBeLessThan(300);
    expect(r.moved).toBe(true);
  });
  it('발 범위 밖으로 나가지 않는다', () => {
    const r = stepFree({ x: 320, y: BOUNDS.y1 }, 0, 1, 6);
    expect(r.pos.y).toBe(BOUNDS.y1);
  });
  it('입력이 없으면 그대로', () => {
    expect(stepFree(START, 0, 0, 6)).toEqual({ pos: START, moved: false });
  });
});

describe('facingOf', () => {
  it.each([
    [1, 0, 'right'],
    [-1, 0, 'left'],
    [0, -1, 'up'],
    [0, 1, 'down'],
    [1, 1, 'right'],
    [-1, -1, 'left'],
  ] as const)('(%i, %i) → %s', (x, y, f) => {
    expect(facingOf(x, y)).toBe(f);
  });
});

describe('zoneAt', () => {
  it('각 구조물 앞 지점은 그 구조물의 반응 구역', () => {
    for (const l of LANDMARKS) expect(zoneAt(frontPoint(l.id)), l.id).toBe(l.id);
  });
  it('구조물에서 먼 인필드 가운데는 구역 밖', () => {
    expect(zoneAt({ x: 420, y: 230 })).toBeNull();
  });
});

describe('planRoute / stepRoute', () => {
  const run = (from: { x: number; y: number }, legs: Leg[]) => {
    let pos = from;
    let rest = legs;
    for (let i = 0; i < 500; i++) {
      const r = stepRoute(pos, rest, 12);
      pos = r.pos;
      rest = r.legs;
      if (r.done) return { pos, ticks: i + 1 };
    }
    throw new Error('도착 못 함');
  };

  it(`앞 지점까지 ${DIRECT_RANGE}px 안이면 직선 한 번`, () => {
    const f = frontPoint('resume');
    const legs = planRoute({ x: f.x + 40, y: f.y }, 'resume');
    expect(legs).toEqual([{ kind: 'point', to: f }]);
  });

  it('멀면 레인으로 가서 레인을 따라간다(최단 방향)', () => {
    const legs = planRoute(START, 'resume'); // 출발선 → 접수 테이블: 시계 방향이 가깝다
    expect(legs[0]!.kind).toBe('point');
    expect(legs[1]!.kind).toBe('lane');
    const lane = legs[1] as Extract<Leg, { kind: 'lane' }>;
    expect(lane.to).toBeLessThan(lane.s);
  });

  it('천막은 레인에서 멀어 마지막에 앞 지점으로 한 번 더', () => {
    const legs = planRoute(START, 'skill');
    expect(legs.at(-1)).toEqual({ kind: 'point', to: { x: 86, y: 106 } });
  });

  it('어느 구조물이든 결국 앞 지점에 도착하고, 가는 길에 막힌 칸을 지나지 않는다', () => {
    for (const l of LANDMARKS) {
      const legs = planRoute({ x: 420, y: 230 }, l.id);
      let pos = { x: 420, y: 230 };
      let rest = legs;
      for (let i = 0; i < 500; i++) {
        const r = stepRoute(pos, rest, 12);
        pos = r.pos;
        rest = r.legs;
        if (r.done) break;
      }
      const f = frontPoint(l.id);
      expect(Math.hypot(pos.x - f.x, pos.y - f.y), l.id).toBeLessThan(1e-6);
    }
    expect(run(START, planRoute(START, 'career')).ticks).toBeLessThan(TRACK.length / 2 / 12 + 10);
  });
});

describe('neighborStation(모바일 ◀ ▶)', () => {
  it('트랙 순서로 다음·이전, 끝에서 처음으로 감김', () => {
    const order = [...LANDMARKS].sort((a, b) => a.s - b.s).map((l) => l.id);
    order.forEach((id, i) => {
      expect(neighborStation(frontPoint(id), id, 1)).toBe(order[(i + 1) % order.length]);
      expect(neighborStation(frontPoint(id), id, -1)).toBe(
        order[(i - 1 + order.length) % order.length],
      );
    });
  });
});
