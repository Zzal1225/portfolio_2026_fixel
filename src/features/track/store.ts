/**
 * 게임 상태(Zustand). 입력 처리(useRunner)와 그리기(World·Runner·HUD)를 잇는 유일한 통로.
 *
 * 왜 Zustand: 틱마다(60ms) t가 바뀌는데, React Context로 내리면 트리 전체가 다시 그려진다.
 * Zustand는 컴포넌트가 고른 조각(selector)만 구독하므로, 러너는 t만, 메뉴는 open만 보고 다시 그린다.
 *
 * 규칙: 여기에는 "상태와 단순 setter"만 둔다. 이동·카메라 계산은 useRunner의 순수 함수(stepRunner·cameraTarget).
 * 그래야 계산을 store 없이 테스트할 수 있다.
 */
import { create } from 'zustand';
import type { LandmarkId, Point, Size } from './layout';
import type { Direction, KeyAxis } from './trackPath';

export type RunnerPhase = 'idle' | 'running' | 'arrived';

/** 한 틱의 입력: 눌린 키(↑↓←→·WASD·◀ ▶)를 합친 벡터. touch는 ◀ ▶ 버튼에서 왔는지 */
export interface RunnerInput {
  dx: KeyAxis;
  dy: KeyAxis;
  touch?: boolean;
}

export const NO_INPUT: RunnerInput = { dx: 0, dy: 0 };

/** 한 틱 계산에 필요한 상태 묶음. stepRunner(snapshot, input) → snapshot */
export interface RunnerSnapshot {
  t: number;
  /** 지금 진행 방향. 멈춰 있으면 마지막 방향을 유지(스프라이트가 바라보는 쪽) */
  dir: Direction;
  phase: RunnerPhase;
  /** 메뉴·미니맵으로 정한 목표. 도착하면 그 창을 연다 */
  auto: { target: number; landmark: LandmarkId } | null;
  /** 반응 구역 안이면 그 구조물(`!` 표시) */
  zone: LandmarkId | null;
  /** 열린 창. 열려 있으면 달리기 입력을 무시한다 */
  open: LandmarkId | null;
  /** 카메라 좌상단(월드 px, 정수) */
  camera: Point;
  /**
   * 지난 틱의 입력. 같은 키를 계속 누르고 있으면 처음 정한 방향을 유지한다(방향 잠금).
   * 이게 없으면 → 를 누른 채 오른쪽 커브 한가운데를 지날 때 내적이 0 → 음수로 바뀌어 멈추거나 되돌아간다.
   */
  held: RunnerInput;
}

/** 인트로 단계. features/intro/timeline.ts 참고 */
export type IntroPhase = 'preload' | 'signal' | 'lap' | 'zoom' | 'greet' | 'hint' | 'done';

export interface IntroState {
  phase: IntroPhase;
  /** 신호등: 0 꺼짐, 1 빨강, 2 노랑, 3 초록 */
  signal: 0 | 1 | 2 | 3;
  /** 화면 가운데 띠 글자 인덱스(ON YOUR MARKS·SET·GO), 없으면 null */
  band: number | null;
  /** 큰 전광판 문구 인덱스(content/intro BOARD_LINES), 없으면 -1 */
  boardLine: number;
  /** reduced-motion이면 손 흔들기·애니메이션 없음 */
  reduced: boolean;
  /**
   * 흑백 → 컬러 부채꼴 각도(도, 0~360). 트랙 중심에서 출발선(아래)부터 러너가 지나온 반시계 각도.
   * 0이면 전부 흑백, 360이면 전부 컬러. 한 바퀴 동안만 의미가 있다.
   */
  sweep: number;
}

export interface GameState extends RunnerSnapshot {
  /** 정수 배율 2·3·4 */
  scale: number;
  /** 화면 크기(CSS px) */
  viewportPx: Size;
  /** 인트로가 배율을 잠시 바꿀 때(절반 배율·정수 줌). null이면 scale을 쓴다 */
  scaleOverride: number | null;
  /**
   * 달리기 입력을 받는가. 인트로(신호등·한 바퀴·줌) 동안 false.
   * useRunner는 이 값이 false면 틱에서 아무것도 하지 않는다(인트로가 t·카메라를 직접 움직이므로).
   */
  inputEnabled: boolean;
  intro: IntroState;
  setIntro: (next: Partial<IntroState>) => void;
  setSnapshot: (next: Partial<RunnerSnapshot>) => void;
  setViewport: (viewportPx: Size, scale: number) => void;
  openPanel: (id: LandmarkId) => void;
  closePanel: () => void;
}

/** 시작 상태: 출발선(t=0), 오른쪽(ccw)을 보고 서 있음. 카메라는 첫 그림이 출발선 근처를 보이도록 임시값 */
export const INITIAL_SNAPSHOT: RunnerSnapshot = {
  t: 0,
  dir: 'ccw',
  phase: 'idle',
  auto: null,
  zone: 'about',
  open: null,
  camera: { x: 160, y: 178 },
  held: NO_INPUT,
};

export const useGame = create<GameState>()((set) => ({
  ...INITIAL_SNAPSHOT,
  scale: 2,
  viewportPx: { w: 1280, h: 720 },
  scaleOverride: null,
  inputEnabled: false,
  intro: { phase: 'preload', signal: 0, band: null, boardLine: -1, reduced: false, sweep: 0 },
  setIntro: (next) => set((s) => ({ intro: { ...s.intro, ...next } })),
  setSnapshot: (next) => set(next),
  setViewport: (viewportPx, scale) => set({ viewportPx, scale }),
  openPanel: (id) => set({ open: id, auto: null }),
  closePanel: () => set({ open: null, phase: 'idle', held: NO_INPUT }),
}));

/** 지금 화면에 쓰는 배율: 인트로가 잠시 바꾼 값이 있으면 그것, 아니면 화면 크기로 정한 값 */
export const selectScale = (s: GameState): number => s.scaleOverride ?? s.scale;
