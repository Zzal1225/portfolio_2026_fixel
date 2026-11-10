/** HUD 문구(영어 라벨, 안내 문장만 한국어). 11-10 시안 채택: 로고·하단 안내 판·◀ ▶ = 이전·다음 지점. */
import type { LandmarkId } from '@/features/track/layout';

/** 왼쪽 위 로고(시안) */
export const LOGO = { name: 'ChanRyeong', sub: 'PORTFOLIO' } as const;

/** 화면 메뉴 순서(시안). 창 이전·다음은 트랙 순서라 다를 수 있다 */
export const MENU_ORDER: readonly LandmarkId[] = [
  'about',
  'career',
  'project1',
  'project2',
  'skill',
  'resume',
];

export const HUD_LABELS = {
  menu: 'Menu',
} as const;

/** PC 하단 가운데 조작 안내 판(시안) */
export const GUIDE = '↑ ↓ ← → 이동 · SPACE 또는 클릭으로 선택';

/** 모바일 ◀ ▶: 트랙 순서로 이전·다음 지점까지 달려가 창을 연다(시안) */
export const TOUCH_LABELS = { prev: 'Go to previous stop', next: 'Go to next stop' } as const;

/** 미니맵(PC)·MAP 버튼(모바일) → 큰 지도 창 */
/** 창 안 맨 위로 버튼(미니맵 자리, 창이 길어질 때). 지도 창도 같이 쓰므로 창 문구 파일(panels.ts)이 아닌 여기 */
export const SCROLL_TOP = {
  text: '▲ TOP',
  label: 'Back to top',
} as const;

export const MAP_LABELS = {
  button: 'MAP',
  open: 'Open track map',
  title: 'MAP',
  close: 'Close',
  hint: '구조물을 누르면 그곳으로 달려갑니다',
} as const;
