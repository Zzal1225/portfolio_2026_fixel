/**
 * 창 6개의 글. 문구는 전부 여기에만 둔다(CLAUDE.md 4장). 화면 코드는 섹션 타입만 보고 그린다.
 *
 * 출처: 기획서 "트랙 위 구조물과 메뉴" 표. Design 시안 문구(portfolio-content.js) 중 기획서와 다른 것
 * (예: 실무 기술에 React Query·Storybook)은 쓰지 않았다.
 *
 * "TODO"로 시작하는 값은 아직 정하지 않은 내용이다. 화면에서 회색으로 보인다(빈칸이 눈에 띄도록).
 * 사용자가 기존 사이트·이력서 문구로 채운다(11-10 합의: 작업이 끝난 뒤 사용자가 수정).
 * 링크 href가 'TODO'면 버튼이 비활성으로 그려진다.
 */
import type { LandmarkId } from '@/features/track/layout';

export type Section =
  | { type: 'text'; heading?: string; body: string }
  | { type: 'stats'; heading?: string; items: readonly { label: string; value: string }[] }
  | {
      type: 'list';
      heading: string;
      numbered?: boolean;
      items: readonly { tag: string; desc: string }[];
    }
  | {
      type: 'timeline';
      heading: string;
      items: readonly { period: string; title: string; desc: string }[];
    }
  | {
      type: 'links';
      heading?: string;
      items: readonly { label: string; href: string; primary?: boolean; download?: boolean }[];
    }
  /** ABOUT PROFILE의 캐릭터 확대 그림 자리 */
  | { type: 'portrait' };

export interface Panel {
  id: LandmarkId;
  /** 창 머리 띠 제목(영어 픽셀 폰트) */
  title: string;
  /** 탭이 있으면 탭별 섹션, 없으면 sections */
  tabs?: readonly { id: string; label: string; sections: readonly Section[] }[];
  sections?: readonly Section[];
}

export const TODO_PREFIX = 'TODO';
export const isTodo = (s: string) => s.startsWith(TODO_PREFIX);

const GITHUB = 'https://github.com/Zzal1225';

export const PANELS: Record<LandmarkId, Panel> = {
  about: {
    id: 'about',
    title: 'ABOUT',
    tabs: [
      {
        id: 'profile',
        label: 'PROFILE',
        sections: [
          { type: 'portrait' },
          {
            type: 'text',
            body: 'TODO: 한 줄 소개(예: 다른 길에서 와서, 기록을 재고 끝까지 닿게 하는 프론트엔드 개발자)',
          },
          {
            type: 'stats',
            items: [
              { label: 'LEVEL', value: 'LV.3 FRONTEND' },
              { label: 'CAREER', value: '2Y 9M' },
              { label: 'PROJECTS', value: '2' },
            ],
          },
          {
            type: 'list',
            heading: '일하는 방식',
            numbered: true,
            items: [
              { tag: 'TODO', desc: 'TODO: 일하는 방식 1' },
              { tag: 'TODO', desc: 'TODO: 일하는 방식 2' },
              { tag: 'TODO', desc: 'TODO: 일하는 방식 3' },
            ],
          },
          {
            type: 'text',
            heading: 'AI와 일하는 법',
            body: 'TODO: AI를 어디에 쓰고, 무엇은 직접 책임지는지',
          },
          { type: 'text', heading: '러닝', body: 'TODO: 꾸준함에 관한 한 줄' },
        ],
      },
      {
        id: 'skills',
        label: 'SKILLS',
        sections: [
          {
            type: 'list',
            heading: '실무',
            items: [
              { tag: 'HTML', desc: 'TODO: 마트 대상 문자 발송 서비스에서 어디에 썼는지' },
              { tag: 'CSS', desc: 'TODO: 어디서 썼는지' },
              { tag: 'SCSS', desc: 'TODO: 어디서 썼는지' },
              { tag: 'JavaScript', desc: 'TODO: 어디서 썼는지' },
              { tag: 'jQuery', desc: 'TODO: 어디서 썼는지' },
              { tag: 'React (초급)', desc: 'TODO: 어디서 썼는지' },
              { tag: 'PHP 템플릿', desc: 'TODO: 어디서 썼는지' },
            ],
          },
          {
            type: 'list',
            heading: '프로젝트',
            items: [
              { tag: 'TypeScript', desc: 'TODO: nanaki·dahda에서 어디에 썼는지' },
              { tag: 'Next.js', desc: 'TODO: 어디서 썼는지' },
              { tag: 'TanStack Query', desc: 'TODO: 어디서 썼는지' },
              { tag: 'Zustand', desc: 'TODO: 어디서 썼는지' },
              { tag: 'Supabase', desc: 'TODO: 어디서 썼는지' },
              { tag: 'Tailwind', desc: 'TODO: 어디서 썼는지' },
              { tag: 'Vitest', desc: 'TODO: 어디서 썼는지' },
              { tag: 'Playwright', desc: 'TODO: 어디서 썼는지' },
              { tag: 'GitHub Actions', desc: 'TODO: 어디서 썼는지' },
            ],
          },
        ],
      },
    ],
  },

  career: {
    id: 'career',
    title: 'CAREER',
    sections: [
      {
        type: 'timeline',
        heading: '코스',
        items: [
          { period: '2013', title: '의류매장', desc: 'TODO: 한 줄 요약' },
          { period: '2018', title: '공인중개사', desc: 'TODO: 한 줄 요약' },
          { period: '2023', title: '웹 퍼블리셔 과정', desc: 'TODO: 한 줄 요약' },
          { period: '2023 ~ 2026', title: '파워텔레콤', desc: 'TODO: 담당 업무 한 줄' },
        ],
      },
      {
        type: 'list',
        heading: '문제 → 해결 → 결과',
        numbered: true,
        items: [
          {
            tag: '리디자인',
            desc: '약 20화면의 공통 CSS/JS를 분리하고 매뉴얼을 만들어, 영업자 방문 설명이 줄고 이탈했던 마트가 돌아왔습니다. TODO: 문장 다듬기',
          },
          {
            tag: '바이트 계산',
            desc: '문자 바이트 계산 버그를 고치고 미리보기를 만들었습니다. TODO: 문장 다듬기',
          },
          { tag: '신규 서비스', desc: '신규 서비스 5건(펫파트너 출시). TODO: 문장 다듬기' },
        ],
      },
      { type: 'text', body: 'TODO: 퇴사·재입사(2025.09~12) 한 줄' },
    ],
  },

  project1: {
    id: 'project1',
    title: 'PROJECT 1 · nanaki',
    sections: [
      {
        type: 'stats',
        items: [
          { label: '1만 건 동기화', value: '3.3→0.93초' },
          { label: '단위 테스트', value: '845/851' },
          { label: 'Lighthouse 모바일', value: '99·95·92' },
        ],
      },
      { type: 'text', heading: '문제', body: 'TODO: nanaki가 해결한 문제' },
      {
        type: 'list',
        heading: '기술 고민',
        numbered: true,
        items: [
          { tag: 'TODO', desc: 'TODO: 결정과 이유 1' },
          { tag: 'TODO', desc: 'TODO: 결정과 이유 2' },
          { tag: 'TODO', desc: 'TODO: 결정과 이유 3' },
        ],
      },
      {
        type: 'text',
        heading: '품질',
        body: 'TODO: 테스트·CI(Lighthouse 모바일 로그인 99·홈 95·기록 92)',
      },
      { type: 'text', heading: '디자인 시스템', body: 'TODO: 토큰·컴포넌트' },
      { type: 'text', heading: '회고', body: 'TODO: 회고' },
      {
        type: 'links',
        items: [
          { label: '바로 체험하기 ↗', href: 'TODO', primary: true },
          { label: 'GitHub ↗', href: 'TODO' },
        ],
      },
    ],
  },

  project2: {
    id: 'project2',
    title: 'PROJECT 2 · dahda',
    sections: [
      {
        type: 'stats',
        items: [
          { label: 'TODO', value: 'TODO' },
          { label: 'TODO', value: 'TODO' },
          { label: 'TODO', value: 'TODO' },
        ],
      },
      {
        type: 'text',
        heading: '문제',
        body: 'TODO: dahda가 해결한 문제(외부 API 3종·큐·웹훅·10만 행 표)',
      },
      {
        type: 'list',
        heading: '기술 고민',
        numbered: true,
        items: [
          { tag: 'TODO', desc: 'TODO: 결정과 이유 1' },
          { tag: 'TODO', desc: 'TODO: 결정과 이유 2' },
          { tag: 'TODO', desc: 'TODO: 결정과 이유 3' },
        ],
      },
      { type: 'text', heading: '품질', body: 'TODO: 수치는 dahda docs/performance.md 확정 후' },
      { type: 'text', heading: '회고', body: 'TODO: 회고' },
      {
        type: 'links',
        items: [
          { label: '체험하기 ↗', href: 'TODO', primary: true },
          { label: 'GitHub ↗', href: 'TODO' },
        ],
      },
    ],
  },

  education: {
    id: 'education',
    title: 'EDUCATION',
    sections: [
      {
        type: 'timeline',
        heading: '교육',
        items: [
          { period: '2023.03 ~ 08', title: '국비 웹 퍼블리셔 과정', desc: 'TODO: 한 줄 요약' },
          { period: '~ 2027.02', title: '학점은행제 컴퓨터공학', desc: '졸업 예정' },
          { period: 'TODO', title: '검정고시', desc: 'TODO' },
        ],
      },
      {
        type: 'list',
        heading: '자격증',
        items: [
          { tag: '공인중개사', desc: 'TODO: 취득 연도' },
          { tag: '한국사 2급', desc: 'TODO: 취득 연도' },
          { tag: '네트워크관리사 2급', desc: 'TODO: 취득 연도' },
        ],
      },
    ],
  },

  resume: {
    id: 'resume',
    title: 'RESUME',
    sections: [
      {
        type: 'text',
        heading: '기록증 받기',
        body: '최신 이력서를 PDF로 받을 수 있습니다.',
      },
      {
        type: 'links',
        items: [
          { label: '이력서 PDF ↓', href: '/resume.pdf', primary: true, download: true },
          { label: '이메일 보내기', href: 'TODO' },
          { label: 'GitHub ↗', href: GITHUB },
        ],
      },
    ],
  },
};

/** 창 공통 라벨(영어 UI 고정) */
export const DIALOG_LABELS = {
  close: 'Close',
  prev: (title: string) => `Previous: ${title}`,
  next: (title: string) => `Next: ${title}`,
} as const;
