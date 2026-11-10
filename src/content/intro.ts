/**
 * 인트로·월드에 보이는 글. 문구는 content/에만 둔다(CLAUDE.md 4장).
 *
 * 전광판 문구가 바뀌는 t도 여기 둔다: "어느 문구가 언제"는 문구와 한 몸이라,
 * 문구를 하나 늘리면 t도 같이 고치게 된다(layout.ts에 두면 두 파일을 오가야 함).
 * 11-10 결정: 경력 연도 3줄 → DISCOVER·PLAN·BUILD 띠 + 자기소개 4문구.
 */

export const BOARD_STEPS = ['DISCOVER', 'PLAN', 'BUILD'] as const;

export interface BoardLine {
  /** 한 바퀴 중 이 문구가 켜지는 지점(0~1) */
  t: number;
  text: string;
  /** 위 띠에서 강조할 단어 순서. 마지막 문구는 셋 다 */
  highlight: readonly number[];
}

export const BOARD_LINES: readonly BoardLine[] = [
  { t: 0.05, text: '문제를 찾고,', highlight: [0] },
  { t: 0.3, text: '해결 방법을 기획하고,', highlight: [1] },
  { t: 0.55, text: '실제 결과물로 만드는', highlight: [2] },
  { t: 0.8, text: '프론트엔드 개발자 박찬령입니다.', highlight: [0, 1, 2] },
];

/** 평소(인트로 밖) 전광판 글자 */
export const BOARD_IDLE = 'CAREER';

/** 인필드 이정표 판 3장 */
export const SIGN_LINES = ['경험은 넓게', '실행은 빠르게', '성장은 꾸준히'] as const;

export const GREETING = 'WELCOME TO MY PORTFOLIO!';

/** 신호등 단계별 화면 가운데 띠(색만으로 뜻을 전하지 않기: 신호등 색 + 글자) */
export const SIGNAL_BANDS = ['ON YOUR MARKS', 'SET', 'GO'] as const;

export const INTRO_LABELS = {
  skip: 'SKIP',
  skipAria: 'Skip intro',
  replay: '▶ REPLAY',
  replayAria: 'Replay intro',
  loading: 'LOADING',
  /** 진행 점 그룹 이름(스크린리더) */
  progress: 'Intro progress',
} as const;

/** 키캡 안내(시안: ← ↑ → ↓ 4개, 0.45초마다 차례로 눌림). 그림이라 aria-hidden, 같은 뜻은 월드 설명이 맡는다 */
export const KEY_HINT = ['←', '↑', '→', '↓'] as const;
