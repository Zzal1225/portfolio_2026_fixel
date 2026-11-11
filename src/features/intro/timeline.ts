/**
 * 인트로 시간표(순수 함수). "인트로 시작 후 t초면 무엇이 어떻게 보이나"만 계산한다. 타이머·store는 useIntro.ts.
 *
 * 11-10 시안 채택: 시안 프로토타입(portfolio-game.js)의 타임라인을 그대로 따른다(약 14.3초).
 *   0.0–0.6 빨강 "ON YOUR MARKS" · 0.6–1.2 노랑 "SET" · 1.2–1.8 초록 "GO"(띠는 2.2초까지)
 *   1.8–10.0 한 바퀴 + 80px(마지막 15% 감속), 월드 전체 배율(Si), 흑백 → 컬러
 *   1.8–2.2 큰 전광판이 제자리에서 가운데로 커짐 · 2.2–9.4 문구 4개(각 1.8초, 켜질 때 네온 깜빡임) · 9.4–10.0 제자리로
 *   10.0–10.8 러너로 줌인(Si → Sz) · 10.8–13.6 손 흔들기 + 인사 · 13.6–14.3 평소 배율로 줌아웃(Sz → Sg), HUD 등장
 * 배율은 이 구간에서 소수가 될 수 있다(시안 채택. 평소 플레이는 여전히 정수 배율).
 *
 * 왜 순수 함수: 단계 경계(1.8s, 10.0s …)·감속 곡선·깜빡임 패턴을 단위 테스트로 고정하려고.
 */
import { BOARD_LINES } from '@/content/intro';
import { TRACK, WORLD, type Point } from '@/features/track/layout';
import type { IntroPhase } from '@/features/track/store';
import { lanePoint } from '@/features/track/movement';
import { lapSweep, worldTransform } from './camera';

export const T = {
  RED: 0.6,
  YEL: 1.2,
  GO: 1.8,
  BAND_END: 2.2,
  BOARD_IN: 2.2,
  ENTRY: 1.8,
  RUN_END: 10.0,
  ZOOM_IN_END: 10.8,
  GREET_END: 13.6,
  END: 14.3,
} as const;
/** 문구 4개가 끝나는 시점 = 2.2 + 1.8 × 4 = 9.4 */
export const BOARD_OUT = T.BOARD_IN + T.ENTRY * BOARD_LINES.length;
/** 한 바퀴 + 80px(아치에 얼굴이 가리지 않는 자리에서 멈춤) */
export const LAP_TOTAL = TRACK.length + 80;

/** 네온 켜짐 깜빡임(0.04초 칸 7개) */
const FLICKER = [1, 0, 1, 0, 0, 1, 1] as const;

export type IntroMode = 'full' | 'reduced';

/**
 * 어떤 인트로를 보여 줄까. 방문 횟수와 무관하게 매번 전체 인트로(11-10 6차 사용자 결정: SKIP이 있으니 재방문도 본다).
 * 버린 것: localStorage.introSeen으로 재방문은 끝 상태부터 — 결정 후 저장 코드째 걷어냄.
 */
export function introMode(reducedMotion: boolean): IntroMode {
  return reducedMotion ? 'reduced' : 'full';
}

export const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 한 바퀴 동안 트랙 거리 s(px). 마지막 15%는 감속해 LAP_TOTAL에서 멈춘다(시안 식) */
export function lapDistance(t: number): number {
  if (t < T.GO) return 0;
  if (t >= T.RUN_END) return LAP_TOTAL;
  const p = (t - T.GO) / (T.RUN_END - T.GO);
  const k = LAP_TOTAL / 0.925;
  return p < 0.85 ? k * p : k * (0.85 + (p - 0.85) - Math.pow(p - 0.85, 2) / 0.3);
}

export interface BoardFrame {
  /** 0 = 제자리(월드 전광판 크기), 1 = 화면 가운데 큰 판 */
  grow: number;
  /** 켜진 문구 인덱스, 없으면 -1 */
  line: number;
  /** 네온 깜빡임: 글자가 지금 켜져 있나 */
  on: boolean;
}

/** 큰 전광판(1.8–10.0초). 그 밖이면 null */
export function boardAt(t: number): BoardFrame | null {
  if (t < T.GO || t >= T.RUN_END) return null;
  const grow = ease(
    t < T.BOARD_IN
      ? (t - T.GO) / (T.BOARD_IN - T.GO)
      : t > BOARD_OUT
        ? 1 - (t - BOARD_OUT) / (T.RUN_END - BOARD_OUT)
        : 1,
  );
  if (t < T.BOARD_IN || t >= BOARD_OUT) return { grow, line: -1, on: false };
  const line = Math.min(BOARD_LINES.length - 1, Math.floor((t - T.BOARD_IN) / T.ENTRY));
  const lt = t - T.BOARD_IN - line * T.ENTRY;
  const on = lt < 0.28 ? FLICKER[Math.min(6, Math.floor(lt / 0.04))] === 1 : lt <= T.ENTRY - 0.14;
  return { grow, line, on };
}

export interface ScaleSet {
  /** 월드 전체가 들어오는 배율 min(w/640, h/360) — 소수 */
  whole: number;
  /** 인사 때 줌인 배율(PC 평소+2, 모바일 3) */
  zoom: number;
  /** 평소 정수 배율 */
  normal: number;
}

export interface IntroFrame {
  phase: IntroPhase;
  signal: 0 | 1 | 2 | 3;
  band: number | null;
  flagUp: boolean;
  /** 러너 트랙 거리(px) */
  s: number;
  scale: number;
  /** 카메라가 화면 가운데에 둘 월드 점(경계 클램프 전) */
  center: Point;
  board: BoardFrame | null;
}

/**
 * full 모드에서 t초의 화면.
 * @param focus 러너 기준점(발 y − 24) — 줌 구간에서 카메라가 향한다
 */
export function introAt(t: number, scales: ScaleSet, focus: Point): IntroFrame {
  const signal: 0 | 1 | 2 | 3 = t < T.RED ? 1 : t < T.YEL ? 2 : 3;
  const band = t < T.RED ? 0 : t < T.YEL ? 1 : t < T.BAND_END ? 2 : null;
  const base = { signal, band, flagUp: t < T.GO, s: lapDistance(t), board: boardAt(t) };
  const worldCenter = { x: WORLD.w / 2, y: WORLD.h / 2 };
  const zoomFocus = { x: focus.x, y: focus.y - 8 };

  if (t < T.GO) return { ...base, phase: 'signal', scale: scales.whole, center: worldCenter };
  if (t < T.RUN_END) return { ...base, phase: 'lap', scale: scales.whole, center: worldCenter };
  if (t < T.ZOOM_IN_END) {
    const e = ease((t - T.RUN_END) / (T.ZOOM_IN_END - T.RUN_END));
    return {
      ...base,
      phase: 'zoomin',
      scale: lerp(scales.whole, scales.zoom, e),
      center: { x: lerp(worldCenter.x, zoomFocus.x, e), y: lerp(worldCenter.y, zoomFocus.y, e) },
    };
  }
  if (t < T.GREET_END) return { ...base, phase: 'greet', scale: scales.zoom, center: zoomFocus };
  if (t < T.END) {
    const e = ease(clamp01((t - T.GREET_END) / (T.END - T.GREET_END)));
    return {
      ...base,
      phase: 'zoomout',
      scale: lerp(scales.zoom, scales.normal, e),
      center: { x: focus.x, y: lerp(zoomFocus.y, focus.y, e) },
    };
  }
  return { ...base, phase: 'ready', signal: 0, scale: scales.normal, center: focus };
}

/** 카메라 좌상단: 화면이 월드보다 크면 가운데 정렬, 아니면 경계 안. 정수 배율일 때만 반올림(시안) */
export function introCamera(
  center: Point,
  scale: number,
  viewportPx: { w: number; h: number },
): Point {
  const vw = viewportPx.w / scale;
  const vh = viewportPx.h / scale;
  const axis = (c: number, v: number, M: number) =>
    v >= M ? (M - v) / 2 : Math.max(0, Math.min(M - v, c - v / 2));
  const x = axis(center.x, vw, WORLD.w);
  const y = axis(center.y, vh, WORLD.h);
  return Number.isInteger(scale) ? { x: Math.round(x), y: Math.round(y) } : { x, y };
}

/** 줌 키프레임 간격(ms): 60Hz 한 프레임. 이 사이는 직선 보간이라 눈에 곡선과 구분되지 않는다 */
const KEYFRAME_MS = 1000 / 60;
/**
 * 줌이 끝난 뒤 마지막 모습을 유지하는 시간(ms). 애니메이션이 끝나면 인라인 transform(틱이 쓴 값)이 드러나는데,
 * 그 값은 다음 틱(최대 60ms 뒤) + transition(60ms)이 지나야 목표에 닿는다. 그 사이 뒤로 튀지 않게 덮어 둔다.
 */
export const KEYFRAME_HOLD_MS = 150;

export interface KeyframeTrack {
  frames: { transform: string; offset: number }[];
  /** 유지 시간을 포함한 전체 길이(ms) */
  duration: number;
}

/** 값 함수를 a~b초 구간에서 60Hz로 샘플링해 Web Animations 키프레임으로(유지 구간 포함) */
export function sampleKeyframes(
  a: number,
  b: number,
  transformAt: (t: number) => string,
): KeyframeTrack {
  const ms = (b - a) * 1000;
  const n = Math.ceil(ms / KEYFRAME_MS);
  const duration = ms + KEYFRAME_HOLD_MS;
  const frames = Array.from({ length: n + 1 }, (_, i) => ({
    transform: transformAt(a + ((b - a) * i) / n),
    offset: (ms * i) / n / duration,
  }));
  frames.push({ transform: transformAt(b), offset: 1 });
  return { frames, duration };
}

/**
 * 줌 구간(a~b초)의 월드 transform 키프레임. 수식은 틱과 똑같이 introAt·introCamera(시안 값).
 *
 * 왜 키프레임으로 미리 굽나: 틱(60ms)마다 목표를 쓰고 CSS transition으로 메우면 곡선이 60ms 직선 조각이 되어 속도가 계단처럼 바뀐다
 * (측정: 배율 변화량의 급변이 이론값의 약 5배). 줌 동안 러너는 멈춰 있어 경로를 미리 알 수 있으므로 통째로 넘기면 브라우저가
 * 합성 스레드에서 프레임마다 보간한다. 메인 스레드가 바빠도 끊기지 않고, 최대 배율을 알아 처음부터 선명하게 그린다.
 * 버린 대안: requestAnimationFrame 루프 — 메인 스레드에 묶이고 CLAUDE.md 금지 규칙.
 *            시작·끝 두 값 + cubic-bezier — 줌과 중심 이동이 곱해진 시안의 곡선 경로와 달라진다.
 */
export function zoomKeyframes(
  a: number,
  b: number,
  scales: ScaleSet,
  focus: Point,
  viewportPx: { w: number; h: number },
): KeyframeTrack {
  return sampleKeyframes(a, b, (t) => {
    const f = introAt(t, scales, focus);
    return worldTransform(introCamera(f.center, f.scale, viewportPx), f.scale);
  });
}

/** t초의 부채꼴 각도(도). 위치가 시간만의 함수라 틱 없이도 계산된다 */
export function sweepAt(t: number): number {
  const s = lapDistance(t);
  return lapSweep(lanePoint(s), s);
}

/**
 * 한 바퀴 전체(GO ~ RUN_END)의 --sweep 키프레임.
 *
 * 왜 transition이 아니라 키프레임 한 개인가: 틱마다 transition을 다시 걸면 틱이 조금만 늦어도 transition이 먼저 끝나
 * 경계선이 잠깐 멈췄다 뛴다(측정: 459프레임 중 297번만 변함, 한 번에 최대 4.6도). 각도는 시간만의 함수라 미리 다 알 수 있다.
 */
export function sweepKeyframes(): { frames: Record<string, string | number>[]; duration: number } {
  const ms = (T.RUN_END - T.GO) * 1000;
  const n = Math.ceil(ms / KEYFRAME_MS);
  const frames = Array.from({ length: n + 1 }, (_, i) => ({
    '--sweep': `${sweepAt(T.GO + ((T.RUN_END - T.GO) * i) / n)}deg`,
    offset: i / n,
  }));
  return { frames, duration: ms };
}
