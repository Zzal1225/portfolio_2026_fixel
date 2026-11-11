/**
 * 게임 상태(Zustand). 입력 처리(useRunner)·인트로(useIntro)와 그리기(World·Runner·HUD)를 잇는 유일한 통로.
 *
 * 왜 Zustand: 틱마다(60ms) 위치가 바뀌는데, React Context로 내리면 트리 전체가 다시 그려진다.
 * Zustand는 컴포넌트가 고른 조각(selector)만 구독하므로, 러너는 pos만, 메뉴는 open만 보고 다시 그린다.
 *
 * 규칙: 여기에는 "상태와 단순 setter"만 둔다. 이동·카메라 계산은 순수 함수(movement.ts·useRunner.stepRunner·cameraTarget).
 *
 * 11-10 시안 채택(자유 이동): 위치가 트랙 위 t 하나에서 월드 좌표 pos(발 위치)로 바뀌었다.
 */
import { create } from 'zustand';
import type { LandmarkId, Point, Size } from './layout';
import type { Leg } from './movement';
import type { Facing, KeyAxis } from './trackPath';

export type RunnerPhase = 'idle' | 'running' | 'arrived';

/** 한 틱의 입력: 눌린 방향키(↑↓←→·WASD)를 합친 벡터 */
export interface RunnerInput {
  dx: KeyAxis;
  dy: KeyAxis;
}

export const NO_INPUT: RunnerInput = { dx: 0, dy: 0 };

/** 한 틱 계산에 필요한 상태 묶음. stepRunner(snapshot, input) → snapshot */
export interface RunnerSnapshot {
  /** 발 위치(월드 px). 스프라이트 32×48은 (x−16, y−48)에 그린다 */
  pos: Point;
  /** 바라보는 방향(스프라이트 행). 멈춰도 유지 */
  facing: Facing;
  phase: RunnerPhase;
  /** 메뉴·지도·구조물 클릭으로 가는 중이면 남은 경로. 도착하면 그 창을 연다 */
  route: { landmark: LandmarkId; legs: Leg[] } | null;
  /** 반응 구역 안이면 그 구조물(`!`·SPACE 표시) */
  zone: LandmarkId | null;
  /** 열린 창. 열려 있으면 달리기 입력을 무시한다 */
  open: LandmarkId | null;
  /** 카메라 좌상단(월드 px) */
  camera: Point;
}

/**
 * 인트로 단계(시안 타임라인, features/intro/timeline.ts).
 * boot = 서버 HTML·하이드레이션 전. 이때 그린 SKIP은 눌러도 아무 일이 없으므로(이벤트 연결 전) 그리지 않는다.
 * ready = 인트로 끝, 키캡 안내(첫 입력까지). done = 첫 입력 뒤.
 */
export type IntroPhase =
  'boot' | 'preload' | 'signal' | 'lap' | 'zoomin' | 'greet' | 'zoomout' | 'ready' | 'done';

export interface IntroState {
  phase: IntroPhase;
  /** 인트로 시작부터 지난 시간(초). 큰 전광판 위치·네온 깜빡임·HUD 등장 정도를 여기서 계산한다 */
  elapsed: number;
  /** 신호등: 0 꺼짐, 1 빨강, 2 노랑, 3 초록 */
  signal: 0 | 1 | 2 | 3;
  /** 화면 가운데 띠 글자 인덱스(ON YOUR MARKS·SET·GO), 없으면 null */
  band: number | null;
  /** reduced-motion이면 손 흔들기·애니메이션 없음 */
  reduced: boolean;
  /** 흑백 → 컬러 부채꼴 각도(도, 0~360). 360이면 전부 컬러 */
  sweep: number;
  /** 첫 로딩 화면을 덮고 있나. 처음 준비가 끝나면 false가 되고 다시 true가 되지 않는다(REPLAY는 이미 받은 그림이라 덮지 않음) */
  covering: boolean;
}

export interface GameState extends RunnerSnapshot {
  /** 평소 정수 배율 2·3·4 */
  scale: number;
  /** 화면 크기(CSS px) */
  viewportPx: Size;
  /** 인트로가 배율을 잠시 바꿀 때(월드 전체 보기·줌인·줌아웃, 11-10 시안 채택으로 소수 가능). null이면 scale */
  scaleOverride: number | null;
  /**
   * 달리기 입력을 받는가. 인트로 연출(신호등 ~ 줌아웃) 동안 false.
   * useRunner는 이 값이 false면 틱에서 아무것도 하지 않는다(인트로가 위치·카메라를 직접 움직이므로).
   */
  inputEnabled: boolean;
  intro: IntroState;
  /**
   * 창 코드(Radix·창 문구)를 받을 때가 됐나. 첫 화면 JS를 줄이려고 창은 처음 필요해질 때 받는다:
   * 자동 이동 출발(route), 반응 구역 진입(zone), 창 열림(open) 중 하나라도 생기면 true, 이후 계속 true.
   */
  panelsNeeded: boolean;
  /**
   * 큰 지도 창이 열려 있나. 지도 창은 MapLauncher가 열지만, 창이 떠 있는 동안 메뉴·미니맵·REPLAY를 숨기려면
   * (✕가 눈에 잘 띄게, 11-10 사용자 요청) HUD 여러 곳이 알아야 해서 스토어에 둔다.
   */
  mapOpen: boolean;
  setMapOpen: (open: boolean) => void;
  setIntro: (next: Partial<IntroState>) => void;
  setViewport: (viewportPx: Size, scale: number) => void;
  openPanel: (id: LandmarkId) => void;
  closePanel: () => void;
}

/** 시작 상태: 출발선 레인(320, 292)에서 오른쪽을 보고 서 있음. 카메라는 첫 그림이 출발선 근처를 보이도록 임시값 */
export const INITIAL_SNAPSHOT: RunnerSnapshot = {
  pos: { x: 320, y: 292 },
  facing: 'right',
  phase: 'idle',
  route: null,
  zone: null,
  open: null,
  camera: { x: 160, y: 178 },
};

export const useGame = create<GameState>()((set) => ({
  ...INITIAL_SNAPSHOT,
  scale: 2,
  viewportPx: { w: 1280, h: 720 },
  scaleOverride: null,
  panelsNeeded: false,
  mapOpen: false,
  setMapOpen: (mapOpen) => set({ mapOpen }),
  inputEnabled: false,
  intro: {
    phase: 'boot',
    elapsed: 0,
    signal: 0,
    band: null,
    reduced: false,
    sweep: 0,
    covering: true,
  },
  setIntro: (next) => set((s) => ({ intro: { ...s.intro, ...next } })),
  setViewport: (viewportPx, scale) => set({ viewportPx, scale }),
  openPanel: (id) => set({ open: id, route: null }),
  closePanel: () => set({ open: null, phase: 'idle' }),
}));

useGame.subscribe((s) => {
  if (!s.panelsNeeded && (s.open !== null || s.route !== null || s.zone !== null)) {
    useGame.setState({ panelsNeeded: true });
  }
});

/** 내용 창이나 지도 창이 떠 있나(HUD 숨김 기준) */
export const selectDialogOpen = (s: GameState): boolean => s.open !== null || s.mapOpen;

/** 지금 화면에 쓰는 배율: 인트로가 잠시 바꾼 값이 있으면 그것, 아니면 화면 크기로 정한 값 */
export const selectScale = (s: GameState): number => s.scaleOverride ?? s.scale;

/** 인트로 연출 중(HUD 숨김·입력 잠금)인가 */
export const INTRO_PLAYING: readonly IntroPhase[] = [
  'boot',
  'preload',
  'signal',
  'lap',
  'zoomin',
  'greet',
  'zoomout',
];
