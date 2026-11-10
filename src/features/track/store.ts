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
import type { Direction } from './trackPath';

export type RunnerPhase = 'idle' | 'running' | 'arrived';

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
}

export interface GameState extends RunnerSnapshot {
  /** 정수 배율 2·3·4 */
  scale: number;
  /** 화면 크기(CSS px) */
  viewportPx: Size;
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
};

export const useGame = create<GameState>()((set) => ({
  ...INITIAL_SNAPSHOT,
  scale: 2,
  viewportPx: { w: 1280, h: 720 },
  setSnapshot: (next) => set(next),
  setViewport: (viewportPx, scale) => set({ viewportPx, scale }),
  openPanel: (id) => set({ open: id, auto: null }),
  closePanel: () => set({ open: null, phase: 'idle' }),
}));
