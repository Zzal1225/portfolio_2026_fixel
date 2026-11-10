/**
 * 메뉴·구조물 이름(영어 고정, 11-09 결정). 화면 라벨·aria-label이 전부 여기서 나온다.
 * 화면 메뉴 순서는 기획서 순서(ABOUT·CAREER·PROJECT 1·2·EDUCATION·RESUME), 창 이전·다음은 트랙 순서(layout.ts).
 */
import type { LandmarkId } from '@/features/track/layout';

export const MENU_LABEL: Record<LandmarkId, string> = {
  about: 'ABOUT',
  project1: 'PROJECT 1',
  career: 'CAREER',
  project2: 'PROJECT 2',
  education: 'EDUCATION',
  resume: 'RESUME',
};

/** 인트로 중 아치 현수막 글자 */
export const ARCH_INTRO_LABEL = 'START';

/** 버튼 aria-label. "Open CAREER" */
export const openLabel = (id: LandmarkId): string => `Open ${MENU_LABEL[id]}`;

/** `!` 말풍선의 시각적 숨김 텍스트(색·아이콘만으로 뜻을 전하지 않기) */
export const zoneHint = (id: LandmarkId): string => `Press Enter to open ${MENU_LABEL[id]}`;
