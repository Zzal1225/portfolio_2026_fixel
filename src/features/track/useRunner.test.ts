/**
 * useRunner.ts의 순수 함수 명세 테스트(구현보다 먼저 썼다).
 */
import { describe, expect, it } from 'vitest';
import { LANDMARKS, TRACK, WORLD } from './layout';
import { AUTO_STEP_PX, STEP_PX } from './runner-config';
import { INITIAL_SNAPSHOT, type RunnerSnapshot } from './store';
import { cameraTarget, combineKeys, stepRunner, zoneAt } from './useRunner';

const L = TRACK.length;
const VIEW = { w: 320, h: 180 }; // 1280×720 @4×
const env = { viewport: VIEW };
const snap = (over: Partial<RunnerSnapshot> = {}): RunnerSnapshot => ({
  ...INITIAL_SNAPSHOT,
  ...over,
});
const lm = (id: string) => {
  const found = LANDMARKS.find((l) => l.id === id);
  if (!found) throw new Error(id);
  return found;
};
const BOTTOM = 70 / L; // 아래 직선, 출발선에서 70px

describe('cameraTarget', () => {
  const cam = { x: 100, y: 100 }; // 여유 상자(가운데 40%) = x 196~324, y 154~226
  it('여유 구간 안이면 그대로', () => {
    expect(cameraTarget({ x: 250, y: 190 }, cam, VIEW, false)).toEqual(cam);
  });
  it('오른쪽으로 벗어나면 벗어난 만큼만 이동', () => {
    expect(cameraTarget({ x: 340, y: 190 }, cam, VIEW, false)).toEqual({ x: 116, y: 100 });
  });
  it('위로 벗어나면 벗어난 만큼만 이동', () => {
    expect(cameraTarget({ x: 250, y: 140 }, cam, VIEW, false)).toEqual({ x: 100, y: 86 });
  });
  it('centered면 focus가 가운데', () => {
    expect(cameraTarget({ x: 300, y: 200 }, cam, VIEW, true)).toEqual({ x: 140, y: 110 });
  });
  it('월드 경계에서 멈춘다', () => {
    expect(cameraTarget({ x: 5, y: 5 }, cam, VIEW, true)).toEqual({ x: 0, y: 0 });
    expect(cameraTarget({ x: 639, y: 359 }, cam, VIEW, true)).toEqual({
      x: WORLD.w - VIEW.w,
      y: WORLD.h - VIEW.h,
    });
  });
  it('화면이 월드보다 크면 가운데 정렬(음수 좌표)', () => {
    expect(cameraTarget({ x: 320, y: 180 }, cam, { w: 800, h: 400 }, false)).toEqual({
      x: -80,
      y: -20,
    });
  });
  it('결과는 정수(배율을 곱하면 정수 CSS px → 픽셀이 번지지 않음)', () => {
    const r = cameraTarget({ x: 333.7, y: 201.3 }, cam, VIEW, true);
    expect(Number.isInteger(r.x) && Number.isInteger(r.y)).toBe(true);
  });
});

describe('zoneAt', () => {
  it('구조물 t 위와 ±23px 안은 그 구조물', () => {
    for (const l of LANDMARKS) {
      expect(zoneAt(l.t)).toBe(l.id);
      expect(zoneAt(l.t + 23 / L)).toBe(l.id);
      expect(zoneAt(l.t - 23 / L)).toBe(l.id);
    }
  });
  it('출발선 바로 전(t≈0.99)도 ABOUT(감기)', () => {
    expect(zoneAt(1 - 10 / L)).toBe('about');
  });
  it('구조물 사이는 null', () => {
    expect(zoneAt(BOTTOM + 100 / L)).toBeNull();
  });
});

describe('stepRunner', () => {
  it('창이 열려 있으면 입력을 무시한다', () => {
    const s = snap({ t: BOTTOM, open: 'career' });
    expect(stepRunner(s, { dx: 1, dy: 0 }, env)).toEqual(s);
  });

  it('아래 직선에서 → 는 ccw로 한 틱(6px) 전진, running', () => {
    const n = stepRunner(snap({ t: BOTTOM }), { dx: 1, dy: 0 }, env);
    expect(n.t).toBeCloseTo(BOTTOM + STEP_PX / L, 10);
    expect(n.dir).toBe('ccw');
    expect(n.phase).toBe('running');
  });

  it('출발선에서 ← 는 0 아래로 감겨 1 근처가 된다', () => {
    const n = stepRunner(snap({ t: 0 }), { dx: -1, dy: 0 }, env);
    expect(n.t).toBeCloseTo(1 - STEP_PX / L, 10);
    expect(n.dir).toBe('cw');
  });

  it('직선에서 ↑ 는 수직 → 멈춤(idle), 위치 그대로', () => {
    const n = stepRunner(snap({ t: BOTTOM, phase: 'running' }), { dx: 0, dy: -1 }, env);
    expect(n.t).toBe(BOTTOM);
    expect(n.phase).toBe('idle');
  });

  it('입력이 없으면 idle, 마지막 방향은 유지', () => {
    const n = stepRunner(snap({ t: BOTTOM, phase: 'running', dir: 'cw' }), { dx: 0, dy: 0 }, env);
    expect(n.phase).toBe('idle');
    expect(n.dir).toBe('cw');
    expect(n.t).toBe(BOTTOM);
  });

  it('자동 이동은 최단 방향으로 2배(12px)', () => {
    const target = lm('resume'); // t≈0.913, 출발선에서는 cw가 가깝다
    const n = stepRunner(
      snap({ t: 0, auto: { target: target.t, landmark: 'resume' } }),
      { dx: 0, dy: 0 },
      env,
    );
    expect(n.dir).toBe('cw');
    expect(n.t).toBeCloseTo(1 - AUTO_STEP_PX / L, 10);
    expect(n.phase).toBe('running');
  });

  it('자동 이동이 한 틱 거리 안에 오면 목표에 맞춰 도착하고 창을 연다', () => {
    const target = lm('career');
    const n = stepRunner(
      snap({ t: target.t - 5 / L, auto: { target: target.t, landmark: 'career' } }),
      { dx: 0, dy: 0 },
      env,
    );
    expect(n.t).toBeCloseTo(target.t, 10);
    expect(n.phase).toBe('arrived');
    expect(n.open).toBe('career');
    expect(n.auto).toBeNull();
  });

  it('자동 이동 중 방향키를 누르면 자동 이동을 취소하고 손으로 달린다', () => {
    const n = stepRunner(
      snap({ t: BOTTOM, auto: { target: lm('career').t, landmark: 'career' } }),
      { dx: -1, dy: 0 },
      env,
    );
    expect(n.auto).toBeNull();
    expect(n.dir).toBe('cw');
    expect(n.t).toBeCloseTo(BOTTOM - STEP_PX / L, 10);
  });

  it('반응 구역에 들어오면 zone이 채워진다(창은 열지 않음)', () => {
    const career = lm('career');
    const n = stepRunner(snap({ t: career.t - 10 / L }), { dx: -1, dy: 0 }, env);
    expect(n.zone).toBe('career');
    expect(n.open).toBeNull();
  });

  it('긴 자동 이동 끝에 반드시 도착한다(무한 루프·떨림 없음)', () => {
    let s = snap({ t: 0, auto: { target: lm('project2').t, landmark: 'project2' } });
    let ticks = 0;
    while (s.phase !== 'arrived' && ticks < 500) {
      s = stepRunner(s, { dx: 0, dy: 0 }, env);
      ticks++;
    }
    expect(s.open).toBe('project2');
    expect(ticks).toBeLessThan(Math.ceil(L / 2 / AUTO_STEP_PX) + 2);
  });
});

describe('stepRunner: 방향 잠금', () => {
  it('→ 를 누른 채 오른쪽 커브를 지나도 멈추거나 되돌아가지 않는다', () => {
    let s = snap({ t: 100 / L });
    const right = { dx: 1, dy: 0 } as const;
    const ts: number[] = [];
    for (let i = 0; i < 80; i++) {
      s = stepRunner(s, right, env);
      ts.push(s.t);
    }
    // 80틱 × 6px = 480px: 출발 100px → 580px(위 직선)까지 계속 ccw로
    expect(s.dir).toBe('ccw');
    expect(s.t * L).toBeCloseTo(100 + 80 * STEP_PX, 6);
    for (let i = 1; i < ts.length; i++) expect(ts[i]!).toBeGreaterThan(ts[i - 1]!);
  });

  it('키를 바꾸면 그 자리 접선으로 방향을 다시 정한다', () => {
    let s = snap({ t: 100 / L });
    s = stepRunner(s, { dx: 1, dy: 0 }, env); // ccw
    s = stepRunner(s, { dx: -1, dy: 0 }, env); // 아래 직선에서 ← = cw
    expect(s.dir).toBe('cw');
  });

  it('터치 ▶ 는 커브 한가운데서 눌러도 달린다(키보드 → 는 수직이라 멈춤)', () => {
    const mid = (140 + (Math.PI * TRACK.laneRadius) / 2) / L;
    expect(stepRunner(snap({ t: mid }), { dx: 1, dy: 0 }, env).phase).toBe('idle');
    const touched = stepRunner(snap({ t: mid }), { dx: 1, dy: 0, touch: true }, env);
    expect(touched.phase).toBe('running');
    expect(touched.dir).toBe('ccw');
  });

  it('입력을 떼면 held가 비워진다', () => {
    const n = stepRunner(snap({ t: BOTTOM }), { dx: 0, dy: 0 }, env);
    expect(n.held).toEqual({ dx: 0, dy: 0 });
  });
});

describe('combineKeys', () => {
  it.each([
    [[], 0, 0],
    [['ArrowRight'], 1, 0],
    [['KeyW'], 0, -1],
    [['ArrowLeft', 'ArrowUp'], -1, -1],
    [['ArrowLeft', 'ArrowRight'], 0, 0],
    [['ArrowLeft', 'KeyA'], -1, 0],
    [['Space', 'KeyQ'], 0, 0],
  ])('%j → (%i, %i)', (codes, dx, dy) => {
    expect(combineKeys(codes)).toEqual({ dx, dy });
  });
});
