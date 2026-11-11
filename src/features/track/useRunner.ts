'use client';
/**
 * 달리기 입력 → 상태 머신(idle → running → arrived) → 카메라 목표.
 *
 * 11-10 시안 채택: 트랙 위 이동(t 하나)에서 **자유 8방향 이동**으로 바뀌었다. 이동 규칙(속도·충돌·반응 구역·자동 경로)은
 * movement.ts의 순수 함수, 여기는 "한 틱을 어떻게 조합하나"(stepRunner)와 카메라(cameraTarget), 그리고 틱·키 훅.
 *
 * 틱: setInterval 60ms 고정. 틱마다 목표 위치·카메라만 쓰고, 사이 구간은 CSS transition(--tick)이 메운다.
 *     rAF 루프를 쓰지 않는다. 탭이 느려져 틱이 밀려도 몰아서 따라잡지 않는다(순간이동 방지).
 *
 * 입력 규칙
 *  - 키보드 ↑↓←→·WASD(e.code 기준). 입력칸·탭 목록·창 안에 포커스가 있으면 방향키는 그쪽 몫이다. Tab은 가로채지 않는다.
 *  - Enter·Space(창 열기)는 포커스가 바탕이나 월드일 때만: 버튼에 포커스가 있으면 그 버튼을 누르는 키다.
 *  - 짧게 톡 누른 키도 한 틱은 반영(tapped).
 *  - 방향키를 누르면 자동 이동은 취소된다. 창이 열리면 눌린 키를 비운다.
 *  - 인트로 연출 중(store.inputEnabled = false)에는 틱이 아무것도 하지 않는다.
 */
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { WORLD, type LandmarkId, type Point, type Size } from './layout';
import {
  SPEED_PX_S,
  facingOf,
  neighborStation,
  planRoute,
  stepFree,
  stepRoute,
  zoneAt,
} from './movement';
import { AUTO_SPEED_RATIO, DEAD_ZONE_RATIO, FOCUS_OFFSET_Y, TICK_MS } from './runner-config';
import { NO_INPUT, selectScale, useGame, type RunnerInput, type RunnerSnapshot } from './store';
import type { KeyAxis } from './trackPath';

export type { RunnerInput };
export { NO_INPUT };

export interface RunnerEnv {
  /** 화면에 보이는 월드 크기(월드 px) = 화면 CSS px / 배율 */
  viewport: Size;
}

/** 한 틱에 가는 거리(월드 px): 110px/s × 60ms = 6.6 */
export const STEP = (SPEED_PX_S * TICK_MS) / 1000;
export const AUTO_STEP = STEP * AUTO_SPEED_RATIO;

/** 한 축: 화면이 월드보다 크면 가운데 정렬(음수 좌표), 아니면 [0, 월드 − 화면] 안으로 */
function clampAxis(c: number, view: number, world: number): number {
  if (view >= world) return (world - view) / 2;
  return Math.max(0, Math.min(world - view, c));
}

/**
 * 카메라 좌상단 목표(월드 px, 정수).
 *  - centered=false: focus가 화면 가운데 40% 상자 안이면 그대로, 밖이면 벗어난 만큼만 민다.
 *  - centered=true(자동 이동): focus를 화면 가운데에.
 *  - 마지막에 월드 경계로 클램프. 클램프한 값을 그대로 저장해야 다음 틱에 경계에서 떨지 않는다.
 *  - 정수로 반올림: 정수 × 정수 배율 = 정수 CSS px → 그림이 번지지 않는다.
 */
export function cameraTarget(focus: Point, cam: Point, viewport: Size, centered: boolean): Point {
  let x = cam.x;
  let y = cam.y;
  if (centered) {
    x = focus.x - viewport.w / 2;
    y = focus.y - viewport.h / 2;
  } else {
    const margin = (1 - DEAD_ZONE_RATIO) / 2; // 0.3: 상자는 화면의 30%~70%
    const left = cam.x + viewport.w * margin;
    const right = cam.x + viewport.w * (1 - margin);
    const top = cam.y + viewport.h * margin;
    const bottom = cam.y + viewport.h * (1 - margin);
    if (focus.x < left) x -= left - focus.x;
    else if (focus.x > right) x += focus.x - right;
    if (focus.y < top) y -= top - focus.y;
    else if (focus.y > bottom) y += focus.y - bottom;
  }
  return {
    x: Math.round(clampAxis(x, viewport.w, WORLD.w)),
    y: Math.round(clampAxis(y, viewport.h, WORLD.h)),
  };
}

/**
 * 한 틱(60ms) 계산. 같은 입력이면 같은 출력(순수).
 *
 *   창 열림          → 그대로(입력 무시)
 *   방향 입력 있음    → 자동 이동 취소, 8방향 한 걸음(벽이면 미끄러짐). 바라보는 방향은 막혀도 입력 쪽으로
 *   자동 이동 중      → 경로를 2배 속도로 진행. 끝나면 arrived + 창 열기
 *   입력 없음         → idle
 *   매 틱            → zone, camera 갱신(자동 이동 중엔 러너를 화면 가운데에)
 */
export function stepRunner(s: RunnerSnapshot, input: RunnerInput, env: RunnerEnv): RunnerSnapshot {
  if (s.open) return s;
  let { pos, facing, route } = s;
  let open: LandmarkId | null = null;
  let phase: RunnerSnapshot['phase'] = 'idle';

  if (input.dx !== 0 || input.dy !== 0) {
    route = null;
    const r = stepFree(pos, input.dx, input.dy, STEP);
    pos = r.pos;
    facing = facingOf(input.dx, input.dy);
    phase = r.moved ? 'running' : 'idle';
  } else if (route) {
    const r = stepRoute(pos, route.legs, AUTO_STEP);
    pos = r.pos;
    if (r.facing) facing = r.facing;
    if (r.done) {
      open = route.landmark;
      phase = 'arrived';
      facing = 'down';
      route = null;
    } else {
      route = { landmark: route.landmark, legs: r.legs };
      phase = 'running';
    }
  }

  const camera = cameraTarget(
    { x: pos.x, y: pos.y - FOCUS_OFFSET_Y },
    s.camera,
    env.viewport,
    route !== null,
  );
  return { pos, facing, phase, route, open, zone: zoneAt(pos), camera };
}

// ---------------------------------------------------------------------------
// 훅
// ---------------------------------------------------------------------------

const KEY_VECTORS: Record<string, [KeyAxis, KeyAxis]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  KeyW: [0, -1],
  KeyS: [0, 1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
};

const toAxis = (v: number): KeyAxis => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** 눌린 키 집합 → 하나의 입력 벡터(반대 키를 같이 누르면 상쇄) */
export function combineKeys(codes: Iterable<string>): RunnerInput {
  let dx = 0;
  let dy = 0;
  for (const c of codes) {
    const v = KEY_VECTORS[c];
    if (v) {
      dx += v[0];
      dy += v[1];
    }
  }
  return { dx: toAxis(dx), dy: toAxis(dy) };
}

export interface RunnerControls {
  /** 메뉴·지도·구조물 클릭: 경로를 짜서 2배 속도로 달려가 도착하면 창을 연다 */
  goTo: (id: LandmarkId) => void;
  /** 모바일 ◀ ▶: 트랙 순서로 이전·다음 구조물까지 자동 이동(시안) */
  stepStation: (delta: 1 | -1) => void;
  /** Enter·Space: 반응 구역 안이면 그 창을 연다 */
  confirm: () => void;
}

const sameSnapshot = (a: RunnerSnapshot, b: RunnerSnapshot) =>
  a.pos.x === b.pos.x &&
  a.pos.y === b.pos.y &&
  a.facing === b.facing &&
  a.phase === b.phase &&
  a.route === b.route &&
  a.zone === b.zone &&
  a.open === b.open &&
  a.camera.x === b.camera.x &&
  a.camera.y === b.camera.y;

/**
 * 틱 루프 + 키 리스너. Game.tsx에서 한 번만 호출한다.
 * @param worldEl 월드 요소. 포커스가 여기나 body에 있을 때만 Enter·Space로 창을 연다.
 */
export function useRunner(worldEl: RefObject<HTMLElement | null>): RunnerControls {
  const keys = useRef(new Set<string>());
  /** 짧게 톡 누른 키: keydown·keyup이 한 틱 안에 끝나도 다음 틱까지 남겨 최소 한 걸음 */
  const tapped = useRef(new Set<string>());

  const clearInput = useCallback(() => {
    keys.current.clear();
    tapped.current.clear();
  }, []);

  useEffect(() => {
    const onWorld = (target: EventTarget | null) =>
      target === document.body ||
      target === document.documentElement ||
      (worldEl.current !== null && target === worldEl.current);
    const ownsArrows = (target: EventTarget | null) =>
      !(
        target instanceof Element &&
        target.closest(
          'input, textarea, select, [contenteditable], [role="tablist"], [role="dialog"]',
        )
      );

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = useGame.getState();
      if (!s.inputEnabled || s.open) return;
      if (KEY_VECTORS[e.code] && ownsArrows(e.target)) {
        e.preventDefault();
        keys.current.add(e.code);
        tapped.current.add(e.code);
      } else if ((e.code === 'Enter' || e.code === 'Space') && s.zone && onWorld(e.target)) {
        e.preventDefault();
        s.openPanel(s.zone);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    const onBlur = () => clearInput();

    const tick = () => {
      const s = useGame.getState();
      if (!s.inputEnabled) return;
      const input = combineKeys(new Set([...keys.current, ...tapped.current]));
      tapped.current.clear();
      const scale = selectScale(s);
      const next = stepRunner(s, input, {
        viewport: { w: s.viewportPx.w / scale, h: s.viewportPx.h / scale },
      });
      if (!sameSnapshot(s, next)) useGame.setState(next);
    };

    const unsubscribe = useGame.subscribe((s, prev) => {
      if (s.open && !prev.open) clearInput();
    });

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    const timer = setInterval(tick, TICK_MS);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      clearInterval(timer);
      unsubscribe();
    };
  }, [worldEl, clearInput]);

  const goTo = useCallback(
    (id: LandmarkId) => {
      const s = useGame.getState();
      // 인트로 중 구조물 클릭: 틱이 멈춰 있어 route만 남았다가, 인트로가 끝나는 순간 러너가 혼자 달려가 버린다
      if (!s.inputEnabled) return;
      clearInput();
      useGame.setState({ route: { landmark: id, legs: planRoute(s.pos, id) }, open: null });
    },
    [clearInput],
  );

  const stepStation = useCallback(
    (delta: 1 | -1) => {
      const s = useGame.getState();
      goTo(neighborStation(s.pos, s.zone, delta));
    },
    [goTo],
  );

  const confirm = useCallback(() => {
    const s = useGame.getState();
    if (s.zone && !s.open) s.openPanel(s.zone);
  }, []);

  return { goTo, stepStation, confirm };
}
