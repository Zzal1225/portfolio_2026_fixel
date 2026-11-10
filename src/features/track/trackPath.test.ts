/**
 * trackPath.ts 명세 테스트. Claude가 먼저 쓰고, 본문은 사용자가 짠다(CLAUDE.md 5-1).
 * TRACK_PATH_READY가 false인 동안은 건너뛴다(CI가 빨갛게 되지 않도록).
 *
 * 기대값은 전부 손으로 계산 가능한 지점만 골랐다:
 *   구간 경계 s = 140 / 454.16 / 734.16 / 1048.32, 반원 한가운데, 그리고 감기(wrap).
 *   s → t 는 s / 둘레(≈1188.32).
 */
import { describe, expect, it } from 'vitest';
import { LANDMARKS, TRACK, rectFromAnchor } from './layout';
import {
  TRACK_PATH_READY,
  facing,
  keyToDirection,
  shortestDirection,
  signedDistance,
  tangent,
  toWorld,
  wrapT,
} from './trackPath';

const L = TRACK.length;
const HALF_CIRCLE = Math.PI * TRACK.laneRadius; // 314.16
const S = {
  rightCurveStart: 140,
  rightCurveMid: 140 + HALF_CIRCLE / 2,
  topStart: 140 + HALF_CIRCLE,
  topMid: 140 + HALF_CIRCLE + 140,
  leftCurveStart: 140 + HALF_CIRCLE + 280,
  leftCurveMid: 140 + HALF_CIRCLE + 280 + HALF_CIRCLE / 2,
  bottomStart: 140 + 2 * HALF_CIRCLE + 280,
};
const t = (s: number) => s / L;

describe.runIf(TRACK_PATH_READY)('trackPath', () => {
  describe('wrapT', () => {
    it.each([
      [0, 0],
      [0.25, 0.25],
      [1, 0],
      [1.25, 0.25],
      [-0.25, 0.75],
      [-1, 0],
      [3.5, 0.5],
    ])('wrapT(%f) = %f', (input, expected) => {
      expect(wrapT(input)).toBeCloseTo(expected, 10);
    });

    it('아주 작은 음수도 [0, 1) 안으로', () => {
      const v = wrapT(-1e-12);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    });
  });

  describe('toWorld: 구간별 좌표', () => {
    it.each([
      ['출발선', 0, 320, 280],
      ['오른쪽 커브 시작', S.rightCurveStart, 460, 280],
      ['오른쪽 커브 한가운데', S.rightCurveMid, 560, 180],
      ['위 직선 시작', S.topStart, 460, 80],
      ['위 직선 한가운데', S.topMid, 320, 80],
      ['왼쪽 커브 시작', S.leftCurveStart, 180, 80],
      ['왼쪽 커브 한가운데', S.leftCurveMid, 80, 180],
      ['아래 직선 시작', S.bottomStart, 180, 280],
      ['결승 70px 전', L - 70, 250, 280],
    ])('%s (s=%f) → (%f, %f)', (_name, s, x, y) => {
      const p = toWorld(t(s));
      expect(p.x).toBeCloseTo(x, 6);
      expect(p.y).toBeCloseTo(y, 6);
      expect(p.footY).toBeCloseTo(y + TRACK.footOffsetY, 6);
    });

    it('t=1 과 t=0 은 같은 점(감기)', () => {
      expect(toWorld(1).x).toBeCloseTo(toWorld(0).x, 6);
      expect(toWorld(1).y).toBeCloseTo(toWorld(0).y, 6);
    });

    it('끊김 없음: 1px 걸으면 좌표도 약 1px 움직인다(구간 경계 포함 전 구간)', () => {
      const step = 1 / L;
      for (let s = 0; s < L; s += 0.5) {
        const a = toWorld(t(s));
        const b = toWorld(t(s) + step);
        expect(Math.hypot(b.x - a.x, b.y - a.y), `s=${s}`).toBeCloseTo(1, 2);
      }
    });

    it('모든 점이 달리는 선(뼈대에서 반지름 100) 위에 있다', () => {
      for (let i = 0; i < 400; i++) {
        const p = toWorld(i / 400);
        const cx = Math.max(TRACK.centerLeft.x, Math.min(TRACK.centerRight.x, p.x));
        expect(Math.hypot(cx - p.x, TRACK.centerLeft.y - p.y)).toBeCloseTo(TRACK.laneRadius, 6);
      }
    });
  });

  describe('tangent', () => {
    it.each([
      ['아래 직선', 70, 1, 0],
      ['오른쪽 커브 한가운데', S.rightCurveMid, 0, -1],
      ['위 직선', S.topMid, -1, 0],
      ['왼쪽 커브 한가운데', S.leftCurveMid, 0, 1],
    ])('%s (s=%f) → (%f, %f)', (_n, s, x, y) => {
      const v = tangent(t(s));
      expect(v.x).toBeCloseTo(x, 6);
      expect(v.y).toBeCloseTo(y, 6);
    });

    it('단위 벡터이고, 좌표 변화(수치 미분)와 방향이 같다', () => {
      const eps = 1e-6;
      for (let i = 0; i < 200; i++) {
        const ti = (i + 0.37) / 200; // 구간 경계를 피해 고른 점
        const v = tangent(ti);
        expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 6);
        const a = toWorld(ti);
        const b = toWorld(ti + eps);
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        expect((b.x - a.x) / len).toBeCloseTo(v.x, 3);
        expect((b.y - a.y) / len).toBeCloseTo(v.y, 3);
      }
    });
  });

  describe('facing', () => {
    it.each([
      [70, 'ccw', 'right'],
      [70, 'cw', 'left'],
      [S.rightCurveMid, 'ccw', 'up'],
      [S.rightCurveMid, 'cw', 'down'],
      [S.topMid, 'ccw', 'left'],
      [S.leftCurveMid, 'ccw', 'down'],
      [S.leftCurveMid, 'cw', 'up'],
    ] as const)('s=%f, %s → %s', (s, dir, expected) => {
      expect(facing(t(s), dir)).toBe(expected);
    });
  });

  describe('signedDistance / shortestDirection', () => {
    it.each([
      [0.1, 0.2, 0.1],
      [0.2, 0.1, -0.1],
      [0.9, 0.1, 0.2], // 1을 넘어 감기
      [0.1, 0.9, -0.2],
      [0.3, 0.3, 0],
      [0, 0.5, 0.5], // 정반대는 +0.5
      [0.5, 0, 0.5],
      [0.25, 0.75, 0.5],
    ])('signedDistance(%f, %f) = %f', (from, to, expected) => {
      expect(signedDistance(from, to)).toBeCloseTo(expected, 10);
    });

    it('범위는 항상 (−0.5, 0.5]', () => {
      for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 50; j++) {
          const d = signedDistance(i / 50, j / 50);
          expect(d).toBeGreaterThan(-0.5);
          expect(d).toBeLessThanOrEqual(0.5);
        }
      }
    });

    it.each([
      [0.9, 0.1, 'ccw'],
      [0.1, 0.9, 'cw'],
      [0.2, 0.4, 'ccw'],
      [0.4, 0.2, 'cw'],
      [0, 0.5, 'ccw'], // 정반대 → ccw로 고정(떨림 방지)
    ] as const)('shortestDirection(%f, %f) = %s', (from, to, expected) => {
      expect(shortestDirection(from, to)).toBe(expected);
    });
  });

  describe('keyToDirection (B안)', () => {
    it.each([
      // 아래 직선: 접선 (1, 0)
      ['아래 직선 ←', 70, -1, 0, 'cw'],
      ['아래 직선 →', 70, 1, 0, 'ccw'],
      ['아래 직선 ↑ (수직)', 70, 0, -1, null],
      ['아래 직선 ↓ (수직)', 70, 0, 1, null],
      ['아래 직선 ↑+→', 70, 1, -1, 'ccw'],
      // 오른쪽 커브 한가운데: 접선 (0, −1)
      ['오른쪽 커브 ↑', S.rightCurveMid, 0, -1, 'ccw'],
      ['오른쪽 커브 ↓', S.rightCurveMid, 0, 1, 'cw'],
      ['오른쪽 커브 ← (수직)', S.rightCurveMid, -1, 0, null],
      ['오른쪽 커브 ↑+←', S.rightCurveMid, -1, -1, 'ccw'],
      // 위 직선: 접선 (−1, 0)
      ['위 직선 ←', S.topMid, -1, 0, 'ccw'],
      ['위 직선 →', S.topMid, 1, 0, 'cw'],
      // 왼쪽 커브 한가운데: 접선 (0, 1)
      ['왼쪽 커브 ↑', S.leftCurveMid, 0, -1, 'cw'],
      ['왼쪽 커브 ↓', S.leftCurveMid, 0, 1, 'ccw'],
      // 아무 키도 없음
      ['입력 없음', 70, 0, 0, null],
    ] as const)('%s', (_n, s, dx, dy, expected) => {
      expect(keyToDirection(t(s), dx, dy)).toBe(expected);
    });

    it('오른쪽 커브 45° 지점(접선 ≈ (0.71, −0.71))에서 → 와 ↑ 는 둘 다 ccw', () => {
      const s45 = S.rightCurveStart + HALF_CIRCLE / 4;
      expect(keyToDirection(t(s45), 1, 0)).toBe('ccw');
      expect(keyToDirection(t(s45), 0, -1)).toBe('ccw');
      expect(keyToDirection(t(s45), -1, 0)).toBe('cw');
    });
  });

  describe('구조물 앞 지점', () => {
    it('각 구조물의 t에 선 러너 발이 그 구조물 그림에서 48px 안에 있다', () => {
      for (const lm of LANDMARKS) {
        const p = toWorld(lm.t);
        const r = rectFromAnchor(lm.anchor, lm.size);
        const nx = Math.max(r.x0, Math.min(r.x1, p.x));
        const ny = Math.max(r.y0, Math.min(r.y1, p.footY));
        expect(Math.hypot(nx - p.x, ny - p.footY), lm.id).toBeLessThanOrEqual(48);
      }
    });
  });
});

it.skipIf(TRACK_PATH_READY)('trackPath는 아직 사용자 작성 전(TRACK_PATH_READY = false)', () => {
  expect(TRACK_PATH_READY).toBe(false);
});
