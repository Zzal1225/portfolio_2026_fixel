/** HUD 문구. 라벨은 영어, 이름만 한국어(번호표 이름 띠). */
import type { LandmarkId } from '@/features/track/layout';

export const BIB = { name: '박찬령', level: 'LV.3 FRONTEND' } as const;

/** 화면 메뉴 순서(기획서 표 순서). 창 이전·다음은 트랙 순서라 다를 수 있다 */
export const MENU_ORDER: readonly LandmarkId[] = [
  'about',
  'career',
  'project1',
  'project2',
  'education',
  'resume',
];

export const HUD_LABELS = {
  menu: 'Menu',
  minimap: 'Track map',
} as const;

/** 모바일 ◀ ▶(누르고 있는 동안 달림). 화면 기준 왼쪽·오른쪽 */
export const TOUCH_LABELS = { left: 'Run left', right: 'Run right' } as const;

/** 모바일 MAP 버튼·큰 지도 창 */
export const MAP_LABELS = {
  button: 'MAP',
  open: 'Open track map',
  title: 'MAP',
  close: 'Close',
  hint: '구조물을 누르면 그곳으로 달려갑니다',
} as const;
