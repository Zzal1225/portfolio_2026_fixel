/**
 * 메뉴·구조물 이름(영어 고정). 화면 라벨·aria-label이 전부 여기서 나온다.
 * ABOUT ME · CAREER · PROJECT · DEV LOG · SKILLS · RESUME.
 * 11-16 사용자 결정: 프로젝트가 nanaki 하나가 되어 PROJECT1 → PROJECT, PROJECT2 자리는 nanaki 개발 기록 창 DEV LOG(처음 TECH LOG로 했다가 같은 날 사용자가 바꿈).
 * id(project1·project2)는 그대로 둔다: 구조물 배치·이동·테스트가 id로 묶여 있고, 화면에 보이는 것은 이 라벨뿐이다.
 * 화면 메뉴 순서는 content/hud.ts MENU_ORDER. 창 이전·다음·모바일 ◀ ▶도 같은 순서(11-12).
 */
import type { LandmarkId } from '@/features/track/layout';

export const MENU_LABEL: Record<LandmarkId, string> = {
  about: 'ABOUT ME',
  project1: 'PROJECT',
  career: 'CAREER',
  project2: 'DEV LOG',
  skill: 'SKILLS',
  resume: 'RESUME',
};

/** 인트로 중 아치 현수막 글자 */
export const ARCH_INTRO_LABEL = 'START';

/** 버튼 aria-label. "Open CAREER" */
export const openLabel = (id: LandmarkId): string => `Open ${MENU_LABEL[id]}`;

/** `!` 말풍선의 시각적 숨김 텍스트(색·아이콘만으로 뜻을 전하지 않기) */
export const zoneHint = (id: LandmarkId): string => `Press Enter to open ${MENU_LABEL[id]}`;

/** 반응 구역 말풍선 안 글자: PC는 키 이름, 모바일은 "!"(SPACE 키가 없음). 11-10 6차 결정 */
export const SPACE_TAG = 'SPACE';
export const ALERT_MARK = '!';
