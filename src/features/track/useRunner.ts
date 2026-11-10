/**
 * 달리기 입력 → 상태 머신(idle → running → arrived) → 카메라 목표.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ 이 파일의 본문은 사용자가 직접 작성한다(CLAUDE.md 5-1).           │
 * │ Claude는 시그니처·테스트(useRunner.test.ts)·힌트만 둔다.          │
 * │ 안내: private/learning/00-roadmap.md "직접 짤 파일 2"             │
 * │       docs/step1-plan.md 2-1(상태 표)·2-2(카메라)                 │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * 구조: 계산은 아래 순수 함수 3개(stepRunner·cameraTarget·zoneAt), 훅은 "틱 돌리기 + 키 리스너 + store에 쓰기"만.
 * 순수 함수는 store·DOM 없이 테스트된다. 다 짰으면 USE_RUNNER_READY를 true로.
 *
 * 쓸 재료:
 *  - trackPath: wrapT, toWorld, keyToDirection, signedDistance, shortestDirection
 *  - layout: LANDMARKS(t·zoneHalfLength), TRACK.length, WORLD
 *  - runner-config: TICK_MS, STEP_PX, AUTO_STEP_PX, DEAD_ZONE_RATIO, FOCUS_OFFSET_Y
 *  - store: useGame(getState/setSnapshot/openPanel), RunnerSnapshot
 */
import type { LandmarkId, Point, Size } from './layout';
import type { RunnerSnapshot } from './store';
import type { KeyAxis } from './trackPath';

export const USE_RUNNER_READY = false;

export interface RunnerInput {
  dx: KeyAxis;
  dy: KeyAxis;
}

export interface RunnerEnv {
  /** 화면에 보이는 월드 크기(월드 px) = 화면 CSS px / scale */
  viewport: Size;
}

/**
 * 한 틱(60ms) 계산. 입력과 이전 상태 → 다음 상태. 같은 입력이면 같은 출력(순수).
 *  - open이 있으면 그대로 돌려준다(입력 무시).
 *  - auto가 있고 방향키 입력이 없으면 자동 이동(AUTO_STEP_PX, 최단 방향). 남은 거리가 한 틱 이하면
 *    t = target으로 맞추고 phase 'arrived', open = auto.landmark, auto = null.
 *  - 방향키 입력이 있으면 auto를 취소하고 keyToDirection으로 STEP_PX만큼. null이면 멈춤(idle).
 *  - 입력이 없으면 idle.
 *  - 매 틱 zone = zoneAt(t), camera = cameraTarget(...) 갱신(자동 이동 중엔 centered).
 */
export function stepRunner(s: RunnerSnapshot, input: RunnerInput, env: RunnerEnv): RunnerSnapshot {
  void input;
  void env;
  return s; // TODO(사용자)
}

/**
 * 카메라 좌상단 목표(월드 px, 정수).
 *  - centered=false: focus가 화면 가운데 40% 상자 안이면 cam 그대로, 밖이면 벗어난 만큼만 이동.
 *  - centered=true: focus를 화면 가운데에.
 *  - 마지막에 월드 경계로 클램프: x ∈ [0, 640 − vw]. 화면이 월드보다 크면 (640 − vw) / 2(가운데 정렬).
 */
export function cameraTarget(focus: Point, cam: Point, viewport: Size, centered: boolean): Point {
  void focus;
  void viewport;
  void centered;
  return cam; // TODO(사용자)
}

/** t가 어느 구조물의 반응 구역(|트랙 거리| ≤ zoneHalfLength) 안인가. 없으면 null */
export function zoneAt(t: number): LandmarkId | null {
  void t;
  return null; // TODO(사용자)
}

export interface RunnerControls {
  /** 메뉴·미니맵·구조물 클릭: 최단 방향 2배 속도로 달려가 도착하면 창을 연다 */
  goTo: (id: LandmarkId) => void;
  /** ◀ ▶ 버튼 누름/뗌(키보드와 같은 경로로 합산) */
  press: (dx: KeyAxis, dy: KeyAxis) => void;
  release: (dx: KeyAxis, dy: KeyAxis) => void;
  /** Enter·Space: 반응 구역 안이면 그 창을 연다 */
  confirm: () => void;
}

/**
 * 틱 루프 + 키 리스너. 페이지에서 한 번만 호출한다.
 * @param worldEl 방향키를 받을 월드 요소(포커스가 있을 때만 달린다. Tab은 가로채지 않음)
 */
export function useRunner(worldEl: { current: HTMLElement | null }): RunnerControls {
  void worldEl;
  // TODO(사용자): 지금은 아무것도 하지 않는 자리표시
  return { goTo: noop, press: noop, release: noop, confirm: noop };
}

function noop(): void {}
