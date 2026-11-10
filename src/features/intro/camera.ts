/**
 * 인트로 카메라 배치(순수 함수). 평소 카메라(여유 구간·따라가기)는 useRunner.cameraTarget이고,
 * 이건 인트로 연출용 두 가지뿐이다: "월드 전체를 가운데" / "러너를 가운데".
 * 평소 카메라와 섞지 않은 이유: 인트로가 끝나면 useRunner가 이 위치에서 이어받으면 되고,
 * 평소 이동 코드에 연출 분기를 넣지 않아도 된다.
 */
import { WORLD, type Point, type Size } from '@/features/track/layout';

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
