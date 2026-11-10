/**
 * useRunner.ts 순수 함수 테스트. 11-10 자유 이동 전환으로 다시 썼다(이동 규칙 자체는 movement.test.ts).
 */
import { describe, expect, it } from 'vitest';
import { WORLD } from './layout';
import { frontPoint, planRoute } from './movement';
import { INITIAL_SNAPSHOT, type RunnerSnapshot } from './store';
import { AUTO_STEP, STEP, cameraTarget, combineKeys, stepRunner } from './useRunner';

const VIEW = { w: 320, h: 180 }; // 1280×720 @4×
const env = { viewport: VIEW };
const snap = (over: Partial<RunnerSnapshot> = {}): RunnerSnapshot => ({
  ...INITIAL_SNAPSHOT,
  ...over,
});
const GRASS = { x: 420, y: 230 }; // 인필드 빈 잔디

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
  it('결과는 정수', () => {
    const r = cameraTarget({ x: 333.7, y: 201.3 }, cam, VIEW, true);
    expect(Number.isInteger(r.x) && Number.isInteger(r.y)).toBe(true);
  });
});

describe('stepRunner', () => {
  it('창이 열려 있으면 입력을 무시한다', () => {
    const s = snap({ pos: GRASS, open: 'career' });
    expect(stepRunner(s, { dx: 1, dy: 0 }, env)).toEqual(s);
  });

  it('→ 는 오른쪽으로 한 틱(6.6px), running, 오른쪽을 본다', () => {
    const n = stepRunner(snap({ pos: GRASS }), { dx: 1, dy: 0 }, env);
    expect(n.pos.x).toBeCloseTo(GRASS.x + STEP, 6);
    expect(n.pos.y).toBe(GRASS.y);
    expect(n.phase).toBe('running');
    expect(n.facing).toBe('right');
  });

  it('↑ 는 위로(트랙 방향과 상관없이 자유 이동)', () => {
    const n = stepRunner(snap({ pos: GRASS }), { dx: 0, dy: -1 }, env);
    expect(n.pos.y).toBeCloseTo(GRASS.y - STEP, 6);
    expect(n.facing).toBe('up');
  });

  it('막혀서 못 움직이면 idle이지만 바라보는 방향은 입력 쪽', () => {
    const n = stepRunner(snap({ pos: { x: 320, y: 48 }, facing: 'down' }), { dx: 0, dy: -1 }, env);
    expect(n.phase).toBe('idle');
    expect(n.facing).toBe('up');
  });

  it('입력이 없으면 idle, 위치·방향 유지', () => {
    const n = stepRunner(
      snap({ pos: GRASS, phase: 'running', facing: 'left' }),
      { dx: 0, dy: 0 },
      env,
    );
    expect(n.phase).toBe('idle');
    expect(n.pos).toEqual(GRASS);
    expect(n.facing).toBe('left');
  });

  it('자동 이동은 2배 속도로 경로를 따라가고, 도착하면 창을 연다', () => {
    let s = snap({ pos: GRASS, route: { landmark: 'career', legs: planRoute(GRASS, 'career') } });
    const first = stepRunner(s, { dx: 0, dy: 0 }, env);
    expect(Math.hypot(first.pos.x - GRASS.x, first.pos.y - GRASS.y)).toBeCloseTo(AUTO_STEP, 6);
    let ticks = 0;
    while (s.open === null && ticks < 500) {
      s = stepRunner(s, { dx: 0, dy: 0 }, env);
      ticks++;
    }
    expect(s.open).toBe('career');
    expect(s.phase).toBe('arrived');
    expect(s.route).toBeNull();
    expect(s.pos).toEqual(frontPoint('career'));
  });

  it('자동 이동 중 방향키를 누르면 자동 이동을 취소한다', () => {
    const s = snap({ pos: GRASS, route: { landmark: 'career', legs: planRoute(GRASS, 'career') } });
    const n = stepRunner(s, { dx: -1, dy: 0 }, env);
    expect(n.route).toBeNull();
    expect(n.pos.x).toBeCloseTo(GRASS.x - STEP, 6);
  });

  it('반응 구역에 들어오면 zone이 채워진다(창은 열지 않음)', () => {
    const f = frontPoint('resume');
    const n = stepRunner(snap({ pos: { x: f.x + 10, y: f.y } }), { dx: -1, dy: 0 }, env);
    expect(n.zone).toBe('resume');
    expect(n.open).toBeNull();
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
