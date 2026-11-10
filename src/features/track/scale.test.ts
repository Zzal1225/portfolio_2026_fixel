import { describe, expect, it } from 'vitest';
import { computeScale, introScale } from './scale';

describe('computeScale', () => {
  it.each([
    ['PC 1280×720', 1280, 720, 4],
    ['PC 1920×1080', 1920, 1080, 4],
    ['노트북 1366×768', 1366, 768, 4],
    ['노트북 1280×650(브라우저 툴바)', 1280, 650, 3],
    ['태블릿 가로 1024×768', 1024, 768, 3],
    ['태블릿 세로 768×1024', 768, 1024, 2],
    ['모바일 390×844', 390, 844, 2],
    ['모바일 가로 844×390', 844, 390, 2],
    ['아주 작은 창 200×200', 200, 200, 2],
    ['960×540 경계', 960, 540, 3],
    ['959×540 경계 바로 아래', 959, 540, 2],
  ])('%s → %i', (_n, w, h, expected) => {
    expect(computeScale(w, h)).toBe(expected);
  });

  it('언제나 정수', () => {
    for (let w = 100; w < 3000; w += 37) {
      for (let h = 100; h < 2000; h += 41) expect(Number.isInteger(computeScale(w, h))).toBe(true);
    }
  });
});

describe('introScale', () => {
  it.each([
    [4, 2],
    [3, 2],
    [2, 1],
  ])('평소 %i배 → 인트로 %i배', (normal, expected) => {
    expect(introScale(normal)).toBe(expected);
  });
});
