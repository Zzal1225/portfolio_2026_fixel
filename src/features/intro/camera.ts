/**
 * 인트로 카메라 배치(순수 함수). 평소 카메라(여유 구간·따라가기)는 useRunner.cameraTarget이고,
 * 이건 인트로 연출용 두 가지뿐이다: "월드 전체를 가운데" / "러너를 가운데".
 * 평소 카메라와 섞지 않은 이유: 인트로가 끝나면 useRunner가 이 위치에서 이어받으면 되고,
 * 평소 이동 코드에 연출 분기를 넣지 않아도 된다.
 */
import { TRACK, WORLD, type Point, type Size } from '@/features/track/layout';

/** 한 축: 화면이 월드보다 크면 가운데 정렬(음수), 아니면 c를 [0, M − v]로 */
function clampAxis(c: number, view: number, world: number): number {
  if (view >= world) return (world - view) / 2;
  return Math.max(0, Math.min(world - view, c));
}

/** 화면 크기(CSS px)와 배율 → 화면에 보이는 월드 크기(월드 px) */
export const viewInWorld = (viewportPx: Size, scale: number): Size => ({
  w: viewportPx.w / scale,
  h: viewportPx.h / scale,
});

/** 월드 전체를 화면 가운데(인트로 한 바퀴) */
export function centerWorld(view: Size): Point {
  return {
    x: Math.round((WORLD.w - view.w) / 2),
    y: Math.round((WORLD.h - view.h) / 2),
  };
}

/** focus를 화면 가운데에, 월드 경계에서 멈춤(줌인·인사) */
export function centerOn(focus: Point, view: Size): Point {
  return {
    x: Math.round(clampAxis(focus.x - view.w / 2, view.w, WORLD.w)),
    y: Math.round(clampAxis(focus.y - view.h / 2, view.h, WORLD.h)),
  };
}

/**
 * 월드 컨테이너의 transform 문자열. World.tsx(평소·틱)와 줌 키프레임(timeline.zoomKeyframes)이 같이 쓴다.
 * 두 곳의 함수 목록이 다르면 애니메이션이 끝나는 순간 그림이 튄다 → 한 곳에서만 만든다.
 */
export const worldTransform = (cam: Point, scale: number): string =>
  `translate3d(${-cam.x * scale}px, ${-cam.y * scale}px, 0) scale(${scale})`;

/** 흑백 → 컬러 부채꼴의 중심(트랙 중심) */
export const SWEEP_CENTER: Point = { x: WORLD.w / 2, y: WORLD.h / 2 };

/**
 * 트랙 중심에서 본 점 p의 각도(도, 0 이상 360 미만). 출발선 방향(아래)이 0이고 화면상 반시계로 커진다.
 * 화면 y가 아래로 +라서 atan2(dx, dy): 아래 (0,1) → 0°, 오른쪽 (1,0) → 90°, 위 → 180°, 왼쪽 → 270°.
 */
export function sweepAngle(p: Point): number {
  const deg = (Math.atan2(p.x - SWEEP_CENTER.x, p.y - SWEEP_CENTER.y) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/** 부채꼴 경계가 지나는 러너의 점: 발에서 12px 위 = 몸 중심(시안 sweep()) */
const SWEEP_BODY_Y = 12;

/**
 * 트랙 거리 s에 있는 러너(발 좌표 p)의 부채꼴 각도. 0 → 360으로 줄곧 커지는 값을 돌려준다.
 *
 * 왜 sweepAngle을 그대로 안 쓰나: 각도는 출발선 근처에서 0 ↔ 360으로 뒤집힌다. 몸 중심과 트랙 거리의 시작점이 조금 달라서
 * 출발 직후 359°(화면 전체가 컬러로 번쩍) 또는 끝나기 직전 1°(전부 흑백으로 번쩍)가 나올 수 있다.
 * 키프레임으로 보간하게 된 뒤로는 359 → 1 같은 값이 "거꾸로 한 바퀴"로 보이므로 더 중요하다.
 * 앞 4분의 1에서 큰 각도는 0, 뒤 4분의 1에서 작은 각도는 360으로 묶는다(시안과 같은 경계값: 5rad ≈ 286°, 1rad ≈ 57°).
 */
export function lapSweep(p: Point, s: number): number {
  if (s <= 0) return 0;
  if (s >= TRACK.length) return 360;
  const a = sweepAngle({ x: p.x, y: p.y - SWEEP_BODY_Y });
  if (s < TRACK.length * 0.25 && a > 286) return 0;
  if (s > TRACK.length * 0.75 && a < 57) return 360;
  return a;
}
