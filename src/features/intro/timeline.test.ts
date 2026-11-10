import { describe, expect, it } from 'vitest';
import { BOARD_LINES } from '@/content/intro';
import {
  GREET_MS,
  LAP_MS,
  SIGNAL_MS,
  ZOOM_STEP_MS,
  boardLineAt,
  fullIntroAt,
  greetStartMs,
  introMode,
  zoomSteps,
} from './timeline';
import { readSeen, writeSeen } from './storage';

describe('introMode', () => {
  it.each([
    [false, false, 'full'],
    [true, false, 'short'],
    [false, true, 'reduced'],
    [true, true, 'reduced'],
  ] as const)('seen=%s reduced=%s → %s', (seen, reduced, mode) => {
    expect(introMode(seen, reduced)).toBe(mode);
  });
});

describe('zoomSteps: 정수 단계만', () => {
  it.each([
    [2, 4, [3, 4]],
    [2, 3, [3]],
    [1, 2, [2]],
    [2, 2, []],
  ])('%i → %i = %j', (from, to, steps) => {
    expect(zoomSteps(from, to)).toEqual(steps);
  });
});

describe('boardLineAt', () => {
  it('첫 문구 전이면 -1, 각 문구의 t부터 그 문구', () => {
    expect(boardLineAt(0)).toBe(-1);
    BOARD_LINES.forEach((l, i) => {
      expect(boardLineAt(l.t)).toBe(i);
      expect(boardLineAt(l.t - 0.001)).toBe(i - 1);
    });
    expect(boardLineAt(0.999)).toBe(BOARD_LINES.length - 1);
  });
});

describe('fullIntroAt (PC: 2× → 3× → 4×)', () => {
  const steps = zoomSteps(2, 4);

  it('신호등: 0.5초마다 빨강·노랑·초록, 띠 글자도 같이', () => {
    expect(fullIntroAt(0, steps)).toMatchObject({ phase: 'signal', signal: 1, band: 0 });
    expect(fullIntroAt(499, steps)).toMatchObject({ signal: 1, band: 0 });
    expect(fullIntroAt(500, steps)).toMatchObject({ signal: 2, band: 1 });
    expect(fullIntroAt(1000, steps)).toMatchObject({ signal: 3, band: 2 });
    expect(fullIntroAt(SIGNAL_MS - 1, steps)).toMatchObject({ phase: 'signal', signal: 3 });
  });

  it('한 바퀴: 1.5초부터 5초 동안 t 0 → 1, 문구가 t에 맞춰 바뀜', () => {
    expect(fullIntroAt(SIGNAL_MS, steps)).toMatchObject({ phase: 'lap', lapT: 0, boardLine: -1 });
    const mid = fullIntroAt(SIGNAL_MS + LAP_MS / 2, steps);
    expect(mid.lapT).toBeCloseTo(0.5, 10);
    expect(mid.boardLine).toBe(1); // 0.3 ≤ 0.5 < 0.55
    expect(fullIntroAt(SIGNAL_MS + LAP_MS - 1, steps).boardLine).toBe(3);
  });

  it('줌: 0.2초마다 정수 배율 한 칸(3 → 4)', () => {
    const z0 = SIGNAL_MS + LAP_MS;
    expect(fullIntroAt(z0, steps)).toMatchObject({ phase: 'zoom', zoomScale: 3, lapT: 1 });
    expect(fullIntroAt(z0 + ZOOM_STEP_MS, steps)).toMatchObject({ zoomScale: 4 });
  });

  it('인사 2.5초 뒤 키캡 안내', () => {
    const g = greetStartMs(steps);
    expect(g).toBe(SIGNAL_MS + LAP_MS + 2 * ZOOM_STEP_MS); // 6.9초
    expect(fullIntroAt(g, steps).phase).toBe('greet');
    expect(fullIntroAt(g + GREET_MS - 1, steps).phase).toBe('greet');
    expect(fullIntroAt(g + GREET_MS, steps).phase).toBe('hint');
  });

  it('모바일(1× → 2×)은 줌 한 단계', () => {
    const mob = zoomSteps(1, 2);
    expect(greetStartMs(mob)).toBe(SIGNAL_MS + LAP_MS + ZOOM_STEP_MS);
    expect(fullIntroAt(SIGNAL_MS + LAP_MS, mob)).toMatchObject({ zoomScale: 2 });
  });
});

describe('storage: introSeen', () => {
  const memory = () => {
    const m = new Map<string, string>();
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
    };
  };
  const broken = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };

  it('처음엔 false, 쓰고 나면 true', () => {
    const s = memory();
    expect(readSeen(s)).toBe(false);
    writeSeen(s);
    expect(readSeen(s)).toBe(true);
  });

  it('읽기 실패(사생활 보호 모드 등)는 "본 것"으로 취급', () => {
    expect(readSeen(broken)).toBe(true);
    expect(() => writeSeen(broken)).not.toThrow();
  });

  it('저장소가 없으면(서버 렌더) 본 것으로 취급', () => {
    expect(readSeen(null)).toBe(true);
  });
});
