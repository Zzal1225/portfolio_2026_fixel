/**
 * 달리기·카메라 상수. useRunner와 화면 컴포넌트가 같은 값을 읽도록 한 곳에 둔다.
 *
 * TICK_MS는 globals.css의 --tick(60ms)과 반드시 같아야 한다.
 * 틱이 transition보다 길면 캐릭터가 멈칫멈칫하고, 짧으면 transition이 끝나기 전에 다음 목표가 와서 뒤처진다.
 * 이동 속도(110px/s)는 movement.ts의 SPEED_PX_S(시안 값).
 */
export const TICK_MS = 60;

/** 메뉴·지도로 가는 자동 이동은 2배(기획서). 시안은 1.6배였지만 이 값은 결정 목록에 없어 기획서 값을 유지 */
export const AUTO_SPEED_RATIO = 2;

/** 카메라 여유 구간: 화면 가운데 가로·세로 40% 상자 안에서는 카메라가 움직이지 않는다 */
export const DEAD_ZONE_RATIO = 0.4;

/** 카메라가 따라가는 점 = 발에서 24px 위(32×48 스프라이트의 세로 가운데) */
export const FOCUS_OFFSET_Y = 24;
