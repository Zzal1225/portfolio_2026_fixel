/**
 * 월드 배경(작업 6): 잔디·관중석·트랙 바닥은 32×32 타일을 background-repeat로 깐다(큰 PNG 한 장 금지).
 *
 * 트랙 고리(곡선 레인)는 타일 반복만으로는 곡선 모양이 안 나와서, 지금은
 * "트랙 타일을 깐 둥근 사각형 + 레인 선 테두리"로 그린다(border-radius = 반지름).
 * 한계: 곡선 가장자리가 브라우저의 매끈한 곡선(안티앨리어싱)이라 시안의 계단식 픽셀 곡선과 다르다.
 * → 고리만 투명 PNG 한 장으로 바꿀지 사용자 결정 대기(docs/design-vs-plan.md #15).
 *
 * 전부 aria-hidden. 구조물·소품은 Landmark·Decor가 따로 그린다. 좌표는 전부 layout.ts.
 */
import type { CSSProperties } from 'react';
import { STANDS, TRACK, WORLD, type Rect } from './layout';

const box = (r: Rect): CSSProperties => ({
  left: r.x0,
  top: r.y0,
  width: r.x1 - r.x0 + 1,
  height: r.y1 - r.y0 + 1,
});

/** 뼈대(두 반원 중심을 잇는 선분)에서 radius만큼 떨어진 스타디움 모양 */
function stadium(radius: number): CSSProperties {
  return {
    left: TRACK.centerLeft.x - radius,
    top: TRACK.centerLeft.y - radius,
    width: TRACK.straight + radius * 2,
    height: radius * 2,
    borderRadius: radius,
  };
}

/** 레인 선: radius 위치에 1px 테두리(테두리 바깥 끝이 radius가 되도록 반 픽셀 보정 없이 radius+1 상자) */
function laneLine(radius: number, color: string): CSSProperties {
  return {
    ...stadium(radius + 1),
    border: `1px solid ${color}`,
    boxSizing: 'border-box',
  };
}

/** 시안 레인 선: 흰색 84·94·105, 바깥 경계 115는 trackDark */
const WHITE_LINES = [TRACK.innerRadius, TRACK.innerRadius + 10, TRACK.innerRadius + 21];
const OUTER_EDGE = TRACK.outerRadius - 1;

export function TrackScene() {
  return (
    <div
      aria-hidden
      className="spr tile-grass absolute inset-0"
      style={{ width: WORLD.w, height: WORLD.h, backgroundRepeat: 'repeat' }}
    >
      {STANDS.map((r, i) => (
        <div
          key={i}
          className="tile-stand absolute"
          style={{
            ...box(r),
            backgroundRepeat: 'repeat',
            backgroundPosition: `${-r.x0}px ${-r.y0}px`,
          }}
        />
      ))}
      <div
        className="tile-track absolute"
        style={{
          ...stadium(TRACK.outerRadius),
          backgroundRepeat: 'repeat',
          // 타일 무늬가 월드 좌표 (0,0)에 맞물리도록(이 div가 어디서 시작하든 이음새가 같은 자리)
          backgroundPosition: `${-(TRACK.centerLeft.x - TRACK.outerRadius)}px ${-(TRACK.centerLeft.y - TRACK.outerRadius)}px`,
        }}
      />
      <div className="absolute" style={laneLine(OUTER_EDGE, 'var(--color-track-dark)')} />
      {WHITE_LINES.map((r) => (
        <div key={r} className="absolute" style={laneLine(r, 'var(--color-white)')} />
      ))}
      {/* 인필드 잔디: 안쪽 레인 선 바로 안 */}
      <div
        className="tile-grass absolute"
        style={{
          ...stadium(TRACK.innerRadius),
          backgroundRepeat: 'repeat',
          backgroundPosition: `${-(TRACK.centerLeft.x - TRACK.innerRadius)}px ${-(TRACK.centerLeft.y - TRACK.innerRadius)}px`,
        }}
      />
      {/* 분필 출발선: 아래 직선 x=320, 레인 폭만큼 */}
      <div
        className="absolute bg-white"
        style={{
          left: TRACK.startX,
          top: TRACK.centerLeft.y + TRACK.innerRadius,
          width: 1,
          height: TRACK.outerRadius - TRACK.innerRadius - 1,
        }}
      />
    </div>
  );
}
