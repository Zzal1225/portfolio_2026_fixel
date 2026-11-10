/**
 * 메뉴·구조물 이름(영어 고정). 화면 라벨·aria-label이 전부 여기서 나온다.
 * 11-10 시안 채택: ABOUT ME · CAREER · PROJECT1 · PROJECT2 · SKILL · RESUME(시안 표기 그대로, 공백 없음).
 * 화면 메뉴 순서는 content/hud.ts MENU_ORDER, 창 이전·다음은 트랙 순서(layout.ts).
 */
import type { LandmarkId } from '@/features/track/layout';

export const MENU_LABEL: Record<LandmarkId, string> = {
  about: 'ABOUT ME',
  project1: 'PROJECT1',
  career: 'CAREER',
  project2: 'PROJECT2',
  skill: 'SKILL',
  resume: 'RESUME',
};

/** 인트로 중 아치 현수막 글자 */
export const ARCH_INTRO_LABEL = 'START';

/** 버튼 aria-label. "Open CAREER" */
export const openLabel = (id: LandmarkId): string => `Open ${MENU_LABEL[id]}`;

/** `!` 말풍선의 시각적 숨김 텍스트(색·아이콘만으로 뜻을 전하지 않기) */
export const zoneHint = (id: LandmarkId): string => `Press Enter to open ${MENU_LABEL[id]}`;

/** 반응 구역에서 러너 옆에 뜨는 키 안내 태그(PC, 시안) */
export const SPACE_TAG = 'SPACE';
