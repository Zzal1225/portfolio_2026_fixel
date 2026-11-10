/**
 * 배치 데이터 검사. 구조물·소품을 옮기다 규칙을 깨면 여기서 바로 잡힌다.
 * trackPath에 의존하지 않도록(배치 검사가 경로 코드 버그에 휩쓸리지 않게), 트랙 위 여부는 "스타디움 뼈대까지 거리"로 직접 잰다.
 * (러너가 서는 자리 ↔ 구조물 거리 검사는 trackPath.test.ts에서 toWorld로 한다.)
 */
import { describe, expect, it } from 'vitest';
import {
  LANDMARKS,
  PROPS,
  PROP_SIZE,
  SIGNPOST,
  STANDS,
  TRACK,
  WORLD,
  rectFromAnchor,
  rectFromTopLeft,
  rectGap,
  type LandmarkId,
  type Rect,
} from './layout';
import { BOARD_LINES } from '@/content/intro';

const TWO_TILES = 2 * WORLD.tile; // 64px

const propRect = (p: { x: number; y: number }): Rect =>
  rectFromTopLeft(p, { w: PROP_SIZE, h: PROP_SIZE });
const landmarkRect = (id: LandmarkId): Rect => {
  const lm = LANDMARKS.find((l) => l.id === id);
  if (!lm) throw new Error(id);
  return rectFromAnchor(lm.anchor, lm.size);
};

/** 픽셀 중심에서 스타디움 뼈대(두 반원 중심을 잇는 선분)까지 거리. 84~116이면 트랙 위 */
function distToSpine(x: number, y: number): number {
  const px = x + 0.5;
  const py = y + 0.5;
  const cx = Math.max(TRACK.centerLeft.x, Math.min(TRACK.centerRight.x, px));
  return Math.hypot(cx - px, TRACK.centerLeft.y - py);
}

function* pixels(r: Rect) {
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) yield [x, y] as const;
}

const inRect = (r: Rect, x: number, y: number) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;

/** 트랙 거리(px)의 부호 있는 최단 차이, (−L/2, L/2] */
function sDist(a: number, b: number): number {
  const L = TRACK.length;
  let d = (((b - a) % L) + L) % L;
  if (d > L / 2) d -= L;
  return d;
}

describe('layout: 구조물', () => {
  it('id 6개가 한 번씩 있고 t는 [0,1) 범위·오름차순', () => {
    const ids = LANDMARKS.map((l) => l.id);
    expect(new Set(ids)).toEqual(
      new Set(['about', 'career', 'project1', 'project2', 'education', 'resume']),
    );
    expect(ids).toHaveLength(6);
    for (const l of LANDMARKS) {
      expect(l.t).toBeGreaterThanOrEqual(0);
      expect(l.t).toBeLessThan(1);
      expect(l.t).toBeCloseTo(l.s / TRACK.length, 10);
    }
    const ts = LANDMARKS.map((l) => l.t);
    expect(ts).toEqual([...ts].sort((a, b) => a - b));
  });

  it('반시계로 돌면 PROJECT 1을 PROJECT 2보다 먼저 만난다 (11-09 D1)', () => {
    const order = LANDMARKS.map((l) => l.id);
    expect(order.indexOf('project1')).toBeLessThan(order.indexOf('project2'));
  });

  it('반응 구역이 서로 겹치지 않는다(끝 → 처음 감기 포함)', () => {
    for (let i = 0; i < LANDMARKS.length; i++) {
      const a = LANDMARKS[i]!;
      const b = LANDMARKS[(i + 1) % LANDMARKS.length]!;
      const gap = Math.abs(sDist(a.s, b.s));
      expect(gap, `${a.id} ↔ ${b.id}`).toBeGreaterThan(a.zoneHalfLength + b.zoneHalfLength);
    }
  });

  it('구조물 그림이 월드 안에 있다', () => {
    for (const l of LANDMARKS) {
      const r = rectFromAnchor(l.anchor, l.size);
      expect(r.x0, l.id).toBeGreaterThanOrEqual(0);
      expect(r.y0, l.id).toBeGreaterThanOrEqual(0);
      expect(r.x1, l.id).toBeLessThan(WORLD.w);
      expect(r.y1, l.id).toBeLessThan(WORLD.h);
    }
  });

  it('둘레는 2·280 + 2π·100', () => {
    expect(TRACK.length).toBeCloseTo(1188.3185, 3);
  });
});

describe('layout: 소품', () => {
  it('모든 소품은 모든 구조물에서 2칸(64px) 이상 떨어져 있다', () => {
    for (const p of PROPS) {
      for (const l of LANDMARKS) {
        const gap = rectGap(propRect(p), landmarkRect(l.id));
        expect(gap, `${p.kind}@(${p.x},${p.y}) ↔ ${l.id}`).toBeGreaterThanOrEqual(TWO_TILES);
      }
    }
  });

  it('소품끼리, 소품과 이정표는 16px 이상 떨어져 있다', () => {
    const sign = rectFromTopLeft(SIGNPOST.topLeft, SIGNPOST.size);
    PROPS.forEach((p, i) => {
      expect(
        rectGap(propRect(p), sign),
        `${p.kind}@(${p.x},${p.y}) ↔ signpost`,
      ).toBeGreaterThanOrEqual(16);
      PROPS.slice(i + 1).forEach((q) => {
        expect(rectGap(propRect(p), propRect(q))).toBeGreaterThanOrEqual(16);
      });
    });
  });

  it('소품은 트랙 레인·관중석 위에 놓이지 않고 월드 안에 있다', () => {
    for (const p of PROPS) {
      const r = propRect(p);
      expect(r.x0 >= 0 && r.y0 >= 0 && r.x1 < WORLD.w && r.y1 < WORLD.h).toBe(true);
      for (const [x, y] of pixels(r)) {
        const d = distToSpine(x, y);
        const onTrack = d >= TRACK.innerRadius && d < TRACK.outerRadius;
        expect(onTrack, `${p.kind}@(${p.x},${p.y}) 픽셀 (${x},${y})`).toBe(false);
        expect(
          STANDS.some((s) => inRect(s, x, y)),
          `${p.kind} 관중석 (${x},${y})`,
        ).toBe(false);
      }
    }
  });
});

describe('layout: 이정표', () => {
  it('인필드 안(트랙 안쪽 경계보다 안)에 있다', () => {
    const r = rectFromTopLeft(SIGNPOST.topLeft, SIGNPOST.size);
    for (const [x, y] of pixels(r)) expect(distToSpine(x, y)).toBeLessThan(TRACK.innerRadius);
  });
});

describe('content: 인트로 전광판 문구', () => {
  it('4개, t는 (0,1) 범위·오름차순', () => {
    expect(BOARD_LINES).toHaveLength(4);
    const ts = BOARD_LINES.map((l) => l.t);
    expect(ts).toEqual([...ts].sort((a, b) => a - b));
    for (const t of ts) {
      expect(t).toBeGreaterThan(0);
      expect(t).toBeLessThan(1);
    }
  });
});
