import { describe, expect, it } from 'vitest';
import { TRACK } from '@/features/track/layout';
import { centerOn, centerWorld, lapSweep, sweepAngle, viewInWorld, worldTransform } from './camera';

describe('intro camera', () => {
  it('PC 1280×720 절반 배율(2×)이면 월드가 화면에 꼭 맞는다', () => {
    expect(centerWorld(viewInWorld({ w: 1280, h: 720 }, 2))).toEqual({ x: 0, y: 0 });
  });
  it('화면이 월드보다 크면 가운데 정렬(음수)', () => {
    expect(centerWorld(viewInWorld({ w: 1920, h: 1080 }, 2))).toEqual({ x: -160, y: -90 });
  });
  it('모바일 1×: 가로는 월드 가운데, 세로는 화면이 더 커서 음수', () => {
    expect(centerWorld(viewInWorld({ w: 390, h: 844 }, 1))).toEqual({ x: 125, y: -242 });
  });
  it('러너를 가운데: 출발선 러너(320, 268) at 4× → (160, 178)', () => {
    expect(centerOn({ x: 320, y: 268 }, { w: 320, h: 180 })).toEqual({ x: 160, y: 178 });
  });
  it('러너를 가운데: 월드 가장자리에서는 멈춘다', () => {
    expect(centerOn({ x: 600, y: 340 }, { w: 320, h: 180 })).toEqual({ x: 320, y: 180 });
  });
});

describe('sweepAngle(흑백 → 컬러 부채꼴)', () => {
  it.each([
    [320, 280, 0],
    [420, 180, 90],
    [320, 80, 180],
    [220, 180, 270],
    [420, 280, 45],
  ])('(%i, %i) → %i°', (x, y, deg) => {
    expect(sweepAngle({ x, y })).toBeCloseTo(deg, 6);
  });
});

describe('lapSweep(한 바퀴 동안 줄곧 커지는 각도)', () => {
  const L = TRACK.length;
  it('출발 전은 전부 흑백(0), 한 바퀴를 다 돌면 전부 컬러(360)', () => {
    expect(lapSweep({ x: 320, y: 280 }, 0)).toBe(0);
    expect(lapSweep({ x: 320, y: 280 }, L)).toBe(360);
  });
  it('출발 직후 몸 중심이 0° 왼쪽에 있어도 359°로 튀지 않는다', () => {
    expect(lapSweep({ x: 319, y: 280 }, 2)).toBe(0);
  });
  it('끝나기 직전 몸 중심이 0°를 넘어도 1°로 되돌아가지 않는다', () => {
    expect(lapSweep({ x: 321, y: 280 }, L - 2)).toBe(360);
  });
  it('경계는 발이 아니라 몸 중심(발 − 12px)을 지난다', () => {
    expect(lapSweep({ x: 420, y: 192 }, L / 2)).toBeCloseTo(90, 6);
  });
});

describe('worldTransform', () => {
  it('카메라 좌표에 배율을 곱해 반대로 민다', () => {
    expect(worldTransform({ x: 10, y: 5 }, 2)).toBe('translate3d(-20px, -10px, 0) scale(2)');
  });
});
