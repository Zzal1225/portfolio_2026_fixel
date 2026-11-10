/**
 * 달리기·카메라 상수. useRunner와 화면 컴포넌트가 같은 값을 읽도록 한 곳에 둔다.
 *
 * TICK_MS는 globals.css의 --tick(60ms)과 반드시 같아야 한다.
 * 틱이 transition보다 길면 캐릭터가 멈칫멈칫하고, 짧으면 transition이 끝나기 전에 다음 목표가 와서 뒤처진다.
 */
export const TICK_MS = 60;

/** 한 틱에 가는 거리(월드 px). 100px/s → 한 바퀴 1188px ≈ 11.9초(기획 "약 12초", 11-09 D6) */
export const STEP_PX = 6;
/** 메뉴·미니맵 자동 이동은 2배 */
export const AUTO_STEP_PX = STEP_PX * 2;

/** 카메라 여유 구간: 화면 가운데 가로·세로 40% 상자 안에서는 카메라가 움직이지 않는다 */
export const DEAD_ZONE_RATIO = 0.4;

/** 카메라가 따라가는 점 = 발에서 24px 위(32×48 스프라이트의 세로 가운데) */
export const FOCUS_OFFSET_Y = 24;
