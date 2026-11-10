/**
 * 월드 배경: 잔디·관중석은 32×32 타일 반복(background-repeat), 곡선 레인 띠만 투명 PNG 한 장.
 *
 * 왜 레인 띠만 그림인가(11-10 결정): 곡선 레인은 반복 무늬가 아니라 타일로 안 나오고,
 * CSS border-radius로 그리면 곡선이 매끈하게 번져 시안의 계단식 픽셀 곡선과 달라진다.
 * 띠 밖은 투명이라 3KB 남짓. 월드 전체를 한 장으로 때우지 않는다는 규칙의 취지는 지킨다.
 *
 * 전부 aria-hidden. 구조물·소품은 Landmark·Decor가 따로 그린다. 좌표는 전부 layout.ts.
 */
import type { CSSProperties } from 'react';
import { STANDS, TRACK_RING, WORLD, type Rect } from './layout';

const tiled = (r: Rect): CSSProperties => ({
  left: r.x0,
  top: r.y0,
  width: r.x1 - r.x0 + 1,
  height: r.y1 - r.y0 + 1,
  backgroundRepeat: 'repeat',
  // 무늬를 월드 (0,0)에 맞물려, 이 칸이 어디서 시작하든 이음새가 같은 자리에 오게
  backgroundPosition: `${-r.x0}px ${-r.y0}px`,
});

export function TrackScene() {
  return (
    <div
      aria-hidden
      className="tile-grass absolute inset-0"
      style={{ width: WORLD.w, height: WORLD.h, backgroundRepeat: 'repeat' }}
    >
      {STANDS.map((r, i) => (
        <div key={i} className="tile-stand absolute" style={tiled(r)} />
      ))}
      <div
        className="spr spr-track-ring absolute"
        style={{
          left: TRACK_RING.topLeft.x,
          top: TRACK_RING.topLeft.y,
          width: TRACK_RING.size.w,
          height: TRACK_RING.size.h,
        }}
      />
    </div>
  );
}
