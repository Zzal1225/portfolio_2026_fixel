/**
 * 인트로 시간표(순수 함수). "몇 ms가 지났으면 무엇이 보이나"만 계산한다. 타이머·store는 useIntro.ts.
 *
 * 왜 순수 함수로 뺐나: 인트로는 눈으로만 확인하면 단계 경계(1.5초, 6.5초 …)에서 생기는 실수를 놓친다.
 * 시간을 넣으면 상태가 나오는 함수면 경계마다 단위 테스트를 걸 수 있다(CLAUDE.md "인트로 조건 단위 테스트 필수").
 *
 * 흐름(기획서 화면 1, CLAUDE.md 2장):
 *   신호등 1.5s(빨강→노랑→초록 0.5s 간격) → 한 바퀴 5s(t 0→1, 문구 4개) → 정수 줌 0.2s × 단계 수
 *   → 인사 2.5s(여기서부터 입력 허용) → 키캡 안내(첫 입력까지) → 끝
 * 재방문: 짧은 인사 1.5s → 키캡. reduced-motion: 인사 말풍선 고정(입력까지) → 끝.
 */
import { BOARD_LINES } from '@/content/intro';
import type { IntroPhase } from '@/features/track/store';

export const SIGNAL_STEP_MS = 500;
export const SIGNAL_MS = SIGNAL_STEP_MS * 3;
export const LAP_MS = 5000;
export const ZOOM_STEP_MS = 200;
export const GREET_MS = 2500;
export const SHORT_GREET_MS = 1500;

export type IntroMode = 'full' | 'short' | 'reduced';

/**
 * 어떤 인트로를 보여 줄까.
 * @param seen localStorage를 읽은 결과. 읽기 실패는 호출 쪽에서 true로 넘긴다(본 것으로 취급).
 */
export function introMode(seen: boolean, reducedMotion: boolean): IntroMode {
  if (reducedMotion) return 'reduced';
  return seen ? 'short' : 'full';
}

/** 평소 배율까지 정수로 한 칸씩 올리는 단계들. 2→4면 [3, 4], 1→2면 [2]. 소수 배율은 없다 */
export function zoomSteps(from: number, to: number): number[] {
  const steps: number[] = [];
  for (let s = from + 1; s <= to; s++) steps.push(s);
  return steps;
}

/** 한 바퀴 진행률 t(0~1)에서 켜져 있는 문구 인덱스. 첫 문구 전이면 -1 */
export function boardLineAt(t: number): number {
  let idx = -1;
  BOARD_LINES.forEach((l, i) => {
    if (t >= l.t) idx = i;
  });
  return idx;
}

export interface IntroFrame {
  phase: IntroPhase;
  signal: 0 | 1 | 2 | 3;
  /** ON YOUR MARKS(0)·SET(1)·GO(2) 띠, 없으면 null */
  band: number | null;
  /** 한 바퀴 진행률(0~1). 한 바퀴 전 0, 후 1 */
  lapT: number;
  boardLine: number;
  /** 줌 단계에서 지금 배율. 줌 전이면 null */
  zoomScale: number | null;
}

/**
 * full 모드에서 elapsed(ms) 시점의 화면.
 * @param steps zoomSteps(절반 배율, 평소 배율)
 */
export function fullIntroAt(elapsed: number, steps: readonly number[]): IntroFrame {
  const base = { band: null, lapT: 0, boardLine: -1, zoomScale: null } as const;
  if (elapsed < SIGNAL_MS) {
    const i = Math.min(2, Math.floor(elapsed / SIGNAL_STEP_MS));
    return { ...base, phase: 'signal', signal: (i + 1) as 1 | 2 | 3, band: i };
  }
  const lapStart = SIGNAL_MS;
  if (elapsed < lapStart + LAP_MS) {
    const lapT = (elapsed - lapStart) / LAP_MS;
    return { ...base, phase: 'lap', signal: 3, lapT, boardLine: boardLineAt(lapT) };
  }
  const zoomStart = lapStart + LAP_MS;
  const zoomMs = steps.length * ZOOM_STEP_MS;
  if (elapsed < zoomStart + zoomMs) {
    const k = Math.floor((elapsed - zoomStart) / ZOOM_STEP_MS);
    return { ...base, phase: 'zoom', signal: 0, lapT: 1, zoomScale: steps[k] ?? null };
  }
  const greetStart = zoomStart + zoomMs;
  if (elapsed < greetStart + GREET_MS) return { ...base, phase: 'greet', signal: 0, lapT: 1 };
  return { ...base, phase: 'hint', signal: 0, lapT: 1 };
}

/** 인사가 시작되는 시점(ms). SKIP은 여기로 점프한다 */
export const greetStartMs = (steps: readonly number[]) =>
  SIGNAL_MS + LAP_MS + steps.length * ZOOM_STEP_MS;
