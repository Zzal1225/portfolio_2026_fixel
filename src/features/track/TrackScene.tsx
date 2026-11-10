/**
 * 월드 배경(임시 색 블록, step1 작업 4). 작업 6에서 타일 PNG(background-repeat)로 바뀐다.
 *
 * 왜 SVG·캔버스가 아니라 div 몇 개인가: 스타디움 모양은 "둥근 끝 사각형" 두 장(바깥 트랙, 안쪽 인필드)으로
 * 정확히 그려진다(border-radius = 반지름). 요소 수가 적고, 카메라가 움직여도 이 div들은 다시 계산되지 않는다
 * (부모 컨테이너의 transform만 바뀜).
 *
 * 전부 aria-hidden: 배경은 정보가 아니다. 구조물 버튼은 Landmark(작업 7)가 따로 그린다.
 * 좌표는 전부 layout.ts에서 읽는다(숫자를 여기 적지 않기).
 */
import { LANDMARKS, STANDS, TRACK, WORLD, rectFromAnchor, type Rect } from './layout';

const box = (r: Rect) => ({
  left: r.x0,
  top: r.y0,
  width: r.x1 - r.x0 + 1,
  height: r.y1 - r.y0 + 1,
});

/** 뼈대(두 반원 중심을 잇는 선분)에서 radius만큼 떨어진 스타디움 모양 */
function stadium(radius: number) {
  return {
    left: TRACK.centerLeft.x - radius,
    top: TRACK.centerLeft.y - radius,
    width: TRACK.straight + radius * 2,
    height: radius * 2,
    borderRadius: radius,
  };
}

export function TrackScene() {
  return (
    <div aria-hidden className="absolute inset-0" style={{ width: WORLD.w, height: WORLD.h }}>
      {STANDS.map((r, i) => (
        <div key={i} className="bg-stand absolute" style={box(r)} />
      ))}
      <div className="bg-track absolute" style={stadium(TRACK.outerRadius)} />
      <div className="bg-grass absolute" style={stadium(TRACK.innerRadius)} />
      {/* 출발선: 아래 직선 x=320, 레인 폭만큼 흰 1px */}
      <div
        className="absolute bg-white"
        style={{
          left: TRACK.startX,
          top: TRACK.centerLeft.y + TRACK.innerRadius,
          width: 1,
          height: TRACK.outerRadius - TRACK.innerRadius,
        }}
      />
      {/* 구조물 자리표시(작업 7에서 그림 + 버튼으로 교체) */}
      {LANDMARKS.map((l) => (
        <div
          key={l.id}
          className="bg-metal-light border-ink absolute border"
          style={box(rectFromAnchor(l.anchor, l.size))}
        />
      ))}
    </div>
  );
}
