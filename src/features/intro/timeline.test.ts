import { describe, expect, it } from 'vitest';
import { BOARD_LINES } from '@/content/intro';
import {
  BOARD_OUT,
  LAP_TOTAL,
  T,
  boardAt,
  introAt,
  introCamera,
  introMode,
  lapDistance,
} from './timeline';
import { readSeen, writeSeen } from './storage';

const SCALES = { whole: 2, zoom: 6, normal: 4 }; // PC 1280×720
const FOCUS = { x: 400, y: 268 };

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

describe('신호등·띠(시안 0.6초 간격)', () => {
  it.each([
    [0, 'signal', 1, 0, true],
    [0.59, 'signal', 1, 0, true],
    [0.6, 'signal', 2, 1, true],
    [1.2, 'signal', 3, 2, true],
    [1.8, 'lap', 3, 2, false], // GO: 깃발 내림, 띠는 2.2초까지
    [2.2, 'lap', 3, null, false],
  ] as const)('%f초 → %s, 신호 %i, 띠 %s, 깃발 듦 %s', (t, phase, signal, band, flagUp) => {
    const f = introAt(t, SCALES, FOCUS);
    expect(f.phase).toBe(phase);
    expect(f.signal).toBe(signal);
    expect(f.band).toBe(band);
    expect(f.flagUp).toBe(flagUp);
  });
});

describe('한 바퀴(lapDistance)', () => {
  it('출발 전 0, 끝나면 둘레 + 80px', () => {
    expect(lapDistance(0)).toBe(0);
    expect(lapDistance(T.GO)).toBe(0);
    expect(lapDistance(T.RUN_END)).toBe(LAP_TOTAL);
    expect(lapDistance(20)).toBe(LAP_TOTAL);
  });
  it('끝나기 직전까지 계속 앞으로(되돌아가지 않음), 끝 무렵 감속', () => {
    let prev = -1;
    for (let t = T.GO; t <= T.RUN_END; t += 0.05) {
      const s = lapDistance(t);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
    const early = lapDistance(T.GO + 1) - lapDistance(T.GO + 0.9);
    const late = lapDistance(T.RUN_END - 0.05) - lapDistance(T.RUN_END - 0.15);
    expect(late).toBeLessThan(early);
    expect(lapDistance(T.RUN_END - 1e-9)).toBeCloseTo(LAP_TOTAL, 3);
  });
});

describe('큰 전광판(boardAt)', () => {
  it('1.8초 전·10초 뒤에는 없다', () => {
    expect(boardAt(1.7)).toBeNull();
    expect(boardAt(T.RUN_END)).toBeNull();
  });
  it('1.8→2.2초 커지고, 9.4→10초 작아진다', () => {
    expect(boardAt(T.GO)!.grow).toBe(0);
    expect(boardAt(T.BOARD_IN)!.grow).toBe(1);
    expect(boardAt(BOARD_OUT + 0.3)!.grow).toBeCloseTo(0.5, 6);
  });
  it('문구 4개가 1.8초씩 차례로, 켜질 때 깜빡이고 끝 0.14초는 꺼짐', () => {
    BOARD_LINES.forEach((_, i) => {
      const start = T.BOARD_IN + i * T.ENTRY;
      expect(boardAt(start + 0.01)).toMatchObject({ line: i, on: true }); // 칸 0: 켜짐
      expect(boardAt(start + 0.05)).toMatchObject({ line: i, on: false }); // 칸 1: 꺼짐
      expect(boardAt(start + 0.5)).toMatchObject({ line: i, on: true });
      expect(boardAt(start + T.ENTRY - 0.05)).toMatchObject({ line: i, on: false });
    });
  });
});

describe('배율·카메라 구간', () => {
  it('한 바퀴 동안 월드 전체 배율, 가운데', () => {
    const f = introAt(5, SCALES, FOCUS);
    expect(f.scale).toBe(2);
    expect(f.center).toEqual({ x: 320, y: 180 });
  });
  it('줌인 10.0→10.8초: 2 → 6, 인사 동안 6, 줌아웃 13.6→14.3초: 6 → 4', () => {
    expect(introAt(T.RUN_END, SCALES, FOCUS).scale).toBe(2);
    expect(introAt(T.ZOOM_IN_END, SCALES, FOCUS)).toMatchObject({ phase: 'greet', scale: 6 });
    expect(introAt(T.GREET_END, SCALES, FOCUS).phase).toBe('zoomout');
    expect(introAt(T.END, SCALES, FOCUS)).toMatchObject({ phase: 'ready', scale: 4 });
  });
  it('introCamera: 화면이 월드보다 크면 가운데 정렬', () => {
    expect(introCamera({ x: 320, y: 180 }, 2, { w: 1280, h: 720 })).toEqual({ x: 0, y: 0 });
    expect(introCamera({ x: 320, y: 180 }, 1, { w: 1280, h: 720 })).toEqual({ x: -320, y: -180 });
  });
  it('introCamera: 소수 배율이면 반올림하지 않는다', () => {
    const c = introCamera({ x: 300.3, y: 200 }, 2.5, { w: 1280, h: 720 });
    expect(Number.isInteger(c.x)).toBe(false);
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
  it('읽기 실패는 "본 것"으로 취급', () => {
    expect(readSeen(broken)).toBe(true);
    expect(() => writeSeen(broken)).not.toThrow();
  });
  it('저장소가 없으면(서버 렌더) 본 것으로 취급', () => {
    expect(readSeen(null)).toBe(true);
  });
});
