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
  /**
   * ABOUT ME 맨 위: 사진 + 그 모서리에 선 러너 + 소개 글.
   * photo.src는 확장자·폭 없는 이름(public/img/{src}-320.webp·-640.webp, scripts/build-photos.mjs가 굽는다).
   * alt는 사진에 보이는 것을 글로(스크린리더가 읽는다). title의 \n은 줄바꿈 그대로.
   */
  | {
      type: 'hero';
      photo: { src: string; alt: string };
      eyebrow: string;
      title: string;
      body: string;
    }
  /** 가로 점선 위의 출발 지점들. current는 지금 달리는 구간(노란 칸) */
  | {
      type: 'starts';
      heading: string;
      items: readonly { period: string; title: string; desc: string; current?: boolean }[];
    }
  /** 강조 상자 한 칸 */
  | { type: 'callout'; body: string }
  /** 이름 | 설명 두 칸 표 */
  | { type: 'traits'; heading: string; items: readonly { tag: string; desc: string }[] };

export interface Panel {
  id: LandmarkId;
  /** 창 머리 띠 제목(영어 픽셀 폰트) */
  title: string;
  /** 제목 옆 부제목(한 줄 설명, 11-10 사용자 결정: "nanaki(부제목)" 형태). 없으면 제목만 */
  subtitle?: string;
  sections: readonly Section[];
}

export const TODO_PREFIX = 'TODO';
export const isTodo = (s: string) => s.startsWith(TODO_PREFIX);

const GITHUB = 'https://github.com/Zzal1225';

export const PANELS: Record<LandmarkId, Panel> = {
  about: {
    id: 'about',
    title: 'ABOUT ME',
    sections: [
      {
        type: 'hero',
        photo: {
          src: 'about-me',
          alt: '러닝대회 완주 기록판(00:41:46) 옆에서 트로피를 들고 선 사진',
        },
        eyebrow: 'WELCOME TO MY PORTFOLIO!',
        title: '트랙 위 캐릭터,\n실제로는 이렇게 달립니다.',
        body: '안녕하세요, 프론트엔드 개발자 박찬령입니다. 이 사이트의 캐릭터는 처음으로 러닝대회에 참가한 날의 저를 그대로 옮겼어요.',
      },
      {
        type: 'starts',
        heading: '세 번 출발선에 섰습니다',
        items: [
          {
            period: '2013~2018',
            title: '브랜드의류 스토어매니저',
            desc: '손님이 어디서 망설이는지 보는 눈',
          },
          {
            period: '2018~2022',
            title: '공인중개사사무소 대표',
            desc: '복잡한 조건을 한 장으로 설명하는 힘',
          },
          {
            period: '2023~2026',
            title: '프론트엔드 개발자',
            desc: '두 가지를 직접 화면으로 만드는 일',
            current: true,
          },
        ],
      },
      {
        type: 'callout',
        body: "TODO: 개발을 시작하게 된 계기 2~3문장. CAREER가 '무엇을 했나'라면 여기는 '왜 바꿨나'.",
      },
      {
        type: 'traits',
        heading: '저는 이런 사람이에요',
        items: [
          {
            tag: '커뮤니케이션이 원활한 사람',
            desc: '매장 매니저, 공인중개사사무소 대표를 거치며 사람이 망설이는 순간을 봤습니다. 화면을 설계할 때도 그 지점부터 찾습니다.',
          },
          { tag: '성장을 즐기는 사람', desc: 'TODO: 빨리 만들어 보고 고친 경험 한 가지' },
          {
            tag: '최신 기술 트렌드에 적극적인 사람',
            desc: 'TODO: 꾸준히 이어 온 습관 (러닝, 공부 기록 등)',
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
    title: 'nanaki',
    subtitle: '기록 PWA',
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
    title: 'dahda',
    subtitle: '문자 발송 콘솔',
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

  skill: {
    id: 'skill',
    title: 'SKILL',
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
  /** 창 아래쪽 이전·다음 묶음 이름 */
  nav: 'Other windows',
  prev: (title: string) => `Previous: ${title}`,
  next: (title: string) => `Next: ${title}`,
} as const;
