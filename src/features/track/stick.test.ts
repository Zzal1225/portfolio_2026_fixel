import { describe, expect, it } from 'vitest';
import { STICK_DEAD_PX, STICK_MAX_PX, knobOffset, stickInput } from './stick';
import { playView, hudBottomPx } from './scale';

describe('stickInput: 끈 거리 → 8방향 입력', () => {
  it('죽은 구간 안은 입력 없음(탭으로 본다)', () => {
    expect(stickInput(0, 0)).toEqual({ dx: 0, dy: 0 });
    expect(stickInput(STICK_DEAD_PX - 1, 0)).toEqual({ dx: 0, dy: 0 });
    expect(stickInput(9, 9)).toEqual({ dx: 0, dy: 0 }); // 길이 12.7
  });

  it('네 방향', () => {
    expect(stickInput(40, 0)).toEqual({ dx: 1, dy: 0 });
    expect(stickInput(-40, 0)).toEqual({ dx: -1, dy: 0 });
    expect(stickInput(0, 40)).toEqual({ dx: 0, dy: 1 }); // 화면 아래 = +y
    expect(stickInput(0, -40)).toEqual({ dx: 0, dy: -1 });
  });

  it('대각선 네 방향', () => {
    expect(stickInput(30, 30)).toEqual({ dx: 1, dy: 1 });
    expect(stickInput(-30, 30)).toEqual({ dx: -1, dy: 1 });
    expect(stickInput(30, -30)).toEqual({ dx: 1, dy: -1 });
    expect(stickInput(-30, -30)).toEqual({ dx: -1, dy: -1 });
  });

  it('경계는 22.5°: 그보다 기울면 대각선, 덜 기울면 직선', () => {
    expect(stickInput(40, 15)).toEqual({ dx: 1, dy: 0 }); // 약 20.6°
    expect(stickInput(40, 18)).toEqual({ dx: 1, dy: 1 }); // 약 24.2°
    expect(stickInput(-15, -40)).toEqual({ dx: 0, dy: -1 });
  });

  it('멀리 끌어도 값은 −1·0·1뿐(속도는 키보드와 같다)', () => {
    expect(stickInput(500, -3)).toEqual({ dx: 1, dy: 0 });
  });
});

describe('knobOffset: 손잡이 그림 위치', () => {
  it('최대 거리 안에서는 손가락 그대로', () => {
    expect(knobOffset(10, -5)).toEqual({ x: 10, y: -5 });
  });
  it('넘으면 방향은 두고 길이만 자른다', () => {
    const k = knobOffset(300, 400); // 3:4:5
    expect(k.x).toBeCloseTo(STICK_MAX_PX * 0.6);
    expect(k.y).toBeCloseTo(STICK_MAX_PX * 0.8);
  });
});

describe('playView: 평소 카메라가 보는 화면(모바일 하단 바 제외)', () => {
  it('PC는 화면 전체', () => {
    expect(hudBottomPx({ w: 1280, h: 720 })).toBe(0);
    expect(playView({ w: 1280, h: 720 }, 4)).toEqual({ w: 320, h: 180 });
  });
  it('모바일(폭 700 미만)은 하단 바 112px을 뺀다', () => {
    expect(hudBottomPx({ w: 390, h: 844 })).toBe(112);
    expect(playView({ w: 390, h: 844 }, 2)).toEqual({ w: 195, h: 366 });
  });
  it('경계: 폭 700은 PC 배치', () => {
    expect(hudBottomPx({ w: 700, h: 900 })).toBe(0);
  });
});
