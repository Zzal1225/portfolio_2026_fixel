'use client';
/**
 * 달리기 입력 → 상태 머신(idle → running → arrived) → 카메라 목표.
 *
 * 구조: 한 틱의 계산은 순수 함수 3개(stepRunner·cameraTarget·zoneAt), 훅은 "틱 돌리기 + 입력 모으기 + store에 쓰기"만.
 * 순수 함수라 store·DOM 없이 테스트된다(useRunner.test.ts).
 *
 * 틱: setInterval 60ms 고정. 틱마다 목표 t·카메라만 쓰고, 사이 구간은 CSS transition(--tick)이 메운다.
 *     rAF 루프를 쓰지 않는다(JS는 초당 약 17번만 일함). 탭이 느려져 틱이 밀려도 몰아서 따라잡지 않는다(순간이동 방지).
 *
 * 입력 규칙
 *  - 키보드 ↑↓←→·WASD(e.code 기준: 한글 자판에서도 W가 KeyW). 입력칸·탭 목록·창 안에 포커스가 있으면
 *    방향키는 그쪽 몫이라 달리지 않는다. 메뉴 버튼은 방향키에 원래 동작이 없어 달린다(마우스로 메뉴를 누른 뒤
 *    포커스가 버튼에 남아도 방향키가 먹도록). Tab은 절대 가로채지 않는다.
 *  - Enter·Space(창 열기)는 포커스가 바탕이나 월드일 때만: 버튼에 포커스가 있으면 그 버튼을 누르는 키다.
 *  - ◀ ▶(터치): 화면 기준 왼쪽·오른쪽. 키보드와 같은 계산이지만 커브 한가운데서도 멈추지 않게 문턱 없이 판정.
 *  - 같은 키를 누르고 있는 동안은 처음 정한 방향을 유지한다(방향 잠금, store.held 참고).
 *  - 창이 열리면 눌린 키를 비운다(닫는 순간 혼자 달려 나가지 않게).
 *  - 인트로 연출 중(store.inputEnabled = false)에는 틱이 아무것도 하지 않는다. 그동안은 useIntro가 t·카메라를 움직인다.
 */
import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { LANDMARKS, TRACK, WORLD, type LandmarkId, type Point, type Size } from './layout';
import { AUTO_STEP_PX, DEAD_ZONE_RATIO, FOCUS_OFFSET_Y, STEP_PX, TICK_MS } from './runner-config';
import { NO_INPUT, selectScale, useGame, type RunnerInput, type RunnerSnapshot } from './store';
import {
  keyToDirection,
  signedDistance,
  toWorld,
  wrapT,
  type Direction,
  type KeyAxis,
} from './trackPath';

export type { RunnerInput };

export interface RunnerEnv {
  /** 화면에 보이는 월드 크기(월드 px) = 화면 CSS px / 배율 */
  viewport: Size;
}

const sign = (d: Direction) => (d === 'ccw' ? 1 : -1);
const sameInput = (a: RunnerInput, b: RunnerInput) =>
  a.dx === b.dx && a.dy === b.dy && !!a.touch === !!b.touch;

/** 한 축: 화면이 월드보다 크면 가운데 정렬(음수 좌표), 아니면 [0, 월드 − 화면] 안으로 */
function clampAxis(c: number, view: number, world: number): number {
  if (view >= world) return (world - view) / 2;
  return Math.max(0, Math.min(world - view, c));
}

/**
 * 카메라 좌상단 목표(월드 px, 정수).
 *  - centered=false: focus가 화면 가운데 40% 상자 안이면 그대로, 밖이면 벗어난 만큼만 민다.
 *  - centered=true(메뉴 자동 이동): focus를 화면 가운데에.
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

/** t가 어느 구조물의 반응 구역(|트랙 거리| ≤ zoneHalfLength) 안인가. 감기(0.99 ↔ 0)는 signedDistance가 처리 */
export function zoneAt(t: number): LandmarkId | null {
  for (const l of LANDMARKS) {
    if (Math.abs(signedDistance(t, l.t)) * TRACK.length <= l.zoneHalfLength) return l.id;
  }
  return null;
}

/**
 * 한 틱(60ms) 계산. 같은 입력이면 같은 출력(순수).
 *
 *   창 열림          → 그대로(입력 무시)
 *   방향 입력 있음    → 자동 이동 취소, 방향 잠금 또는 keyToDirection으로 STEP_PX 전진. 수직이면 idle
 *   자동 이동 중      → 최단 방향으로 AUTO_STEP_PX. 남은 거리 ≤ 한 틱이면 목표에 맞추고 arrived + 창 열기
 *   입력 없음         → idle(마지막 방향 유지 = 스프라이트가 보던 쪽)
 *   매 틱            → zone, camera 갱신
 */
export function stepRunner(s: RunnerSnapshot, input: RunnerInput, env: RunnerEnv): RunnerSnapshot {
  if (s.open) return s;
  const L = TRACK.length;
  const hasInput = input.dx !== 0 || input.dy !== 0;
  let { t, dir, auto } = s;
  // s.open은 위에서 null로 좁혀졌으므로 타입을 넓혀 둔다(도착하면 여기에 구조물 id가 들어감)
  let open: LandmarkId | null = null;
  let phase: RunnerSnapshot['phase'] = 'idle';

  if (hasInput) {
    auto = null;
    // 같은 키를 계속 누르고 있으면 방향을 다시 계산하지 않는다(커브에서 멈춤·되돌아감 방지)
    const locked = s.phase === 'running' && sameInput(input, s.held);
    const d = locked ? s.dir : keyToDirection(t, input.dx, input.dy, !input.touch);
    if (d) {
      dir = d;
      t = wrapT(t + (sign(d) * STEP_PX) / L);
      phase = 'running';
    }
  } else if (auto) {
    const remaining = signedDistance(t, auto.target) * L;
    if (Math.abs(remaining) <= AUTO_STEP_PX) {
      t = auto.target;
      phase = 'arrived';
      open = auto.landmark;
      auto = null;
    } else {
      dir = remaining > 0 ? 'ccw' : 'cw';
      t = wrapT(t + (sign(dir) * AUTO_STEP_PX) / L);
      phase = 'running';
    }
  }

  const p = toWorld(t);
  const camera = cameraTarget(
    { x: p.x, y: p.footY - FOCUS_OFFSET_Y },
    s.camera,
    env.viewport,
    auto !== null,
  );
  return {
    t,
    dir,
    phase,
    auto,
    open,
    zone: zoneAt(t),
    camera,
    held: hasInput ? input : NO_INPUT,
  };
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
  /** 메뉴·미니맵·구조물 클릭: 최단 방향 2배 속도로 달려가 도착하면 창을 연다 */
  goTo: (id: LandmarkId) => void;
  /** ◀ ▶ 버튼 누름/뗌 */
  press: (dx: KeyAxis) => void;
  release: (dx: KeyAxis) => void;
  /** Enter·Space: 반응 구역 안이면 그 창을 연다 */
  confirm: () => void;
}

const sameSnapshot = (a: RunnerSnapshot, b: RunnerSnapshot) =>
  a.t === b.t &&
  a.dir === b.dir &&
  a.phase === b.phase &&
  a.auto === b.auto &&
  a.zone === b.zone &&
  a.open === b.open &&
  a.camera.x === b.camera.x &&
  a.camera.y === b.camera.y &&
  sameInput(a.held, b.held);

/**
 * 틱 루프 + 키 리스너. Game.tsx에서 한 번만 호출한다.
 * @param worldEl 월드 요소. 포커스가 여기나 body에 있을 때만 Enter·Space로 창을 연다.
 */
export function useRunner(worldEl: RefObject<HTMLElement | null>): RunnerControls {
  const keys = useRef(new Set<string>());
  /**
   * 짧게 톡 누른 키: keydown과 keyup이 한 틱(60ms) 안에 끝나면 틱이 키를 못 본다.
   * 눌린 적 있는 키를 다음 틱까지 남겨 두어 최소 한 걸음은 반영한다(틱이 읽고 비움).
   */
  const tapped = useRef(new Set<string>());
  const touch = useRef<KeyAxis>(0);

  const clearInput = useCallback(() => {
    keys.current.clear();
    tapped.current.clear();
    touch.current = 0;
  }, []);

  useEffect(() => {
    /** 포커스가 페이지 바탕이나 월드인가(Enter·Space를 달리기가 써도 되는가) */
    const onWorld = (target: EventTarget | null) =>
      target === document.body ||
      target === document.documentElement ||
      (worldEl.current !== null && target === worldEl.current);
    /** 방향키를 원래 쓰는 곳(입력칸·탭 목록·창)이 아닌가 */
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
    // 뗄 때는 포커스·창과 상관없이 항상 지운다(누른 채 창이 열리고 닫혀도 키가 남지 않게)
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    const onBlur = () => clearInput();

    const tick = () => {
      const s = useGame.getState();
      if (!s.inputEnabled) return;
      const keyInput = combineKeys(new Set([...keys.current, ...tapped.current]));
      tapped.current.clear();
      const input: RunnerInput =
        keyInput.dx !== 0 || keyInput.dy !== 0
          ? keyInput
          : touch.current !== 0
            ? { dx: touch.current, dy: 0, touch: true }
            : NO_INPUT;
      const scale = selectScale(s);
      const next = stepRunner(s, input, {
        viewport: { w: s.viewportPx.w / scale, h: s.viewportPx.h / scale },
      });
      if (!sameSnapshot(s, next)) useGame.setState(next);
    };

    // 창이 열리면(도착·Enter·메뉴) 눌린 키를 비운다
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
      const lm = LANDMARKS.find((l) => l.id === id);
      if (!lm) return;
      clearInput();
      useGame.setState({ auto: { target: lm.t, landmark: id }, held: NO_INPUT });
    },
    [clearInput],
  );

  const press = useCallback((dx: KeyAxis) => {
    touch.current = dx;
  }, []);
  const release = useCallback((dx: KeyAxis) => {
    if (touch.current === dx) touch.current = 0;
  }, []);

  const confirm = useCallback(() => {
    const s = useGame.getState();
    if (s.zone && !s.open) s.openPanel(s.zone);
  }, []);

  return { goTo, press, release, confirm };
}
