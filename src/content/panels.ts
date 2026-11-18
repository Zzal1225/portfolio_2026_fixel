/**
 * 창 6개의 글. 문구는 전부 여기에만 둔다(CLAUDE.md 4장). 화면 코드는 섹션 타입만 보고 그린다.
 *
 * 출처: 기획서 "트랙 위 구조물과 메뉴" 표. Design 시안 문구(portfolio-content.js) 중 기획서와 다른 것
 * (예: 실무 기술에 React Query·Storybook)은 쓰지 않았다.
 *
 * "TODO"로 시작하는 값은 아직 정하지 않은 내용이다. 화면에서 "[나머지]" 회색 빈칸으로 보인다(시안의 [YYYY.MM] 표기).
 * PROJECT(nanaki)는 11-12 사용자 시안(NanakiQuest "퀘스트 로그") 배치: 소개 판 → 주요 기능 → 사용 기술 → 디자인 시스템.
 * DEV LOG는 nanaki 개발 기록(11-16, 예전 PROJECT2 자리. 사용자 시안 배치).
 * 사용자가 기존 사이트·이력서 문구로 채운다(11-10 합의: 작업이 끝난 뒤 사용자가 수정).
 * 링크 href가 'TODO'면 버튼이 비활성으로 그려진다.
 */
import type { LandmarkId } from '@/features/track/layout';

export type Section =
  | { type: 'text'; heading?: string; body: string }
  /**
   * 프로젝트 창 맨 위 남색 판(11-12 사용자 시안 "퀘스트 로그"): 위에 걸친 이름표(title, badge가 있으면 그 앞에 작은 영어 표시) + 소개 글 + 이름-값 칸들.
   * facts의 href가 있으면 링크(새 탭), TODO면 글자만(가짜 링크 금지).
   */
  | {
      type: 'quest';
      badge?: string;
      title: string;
      body: string;
      facts: readonly { label: string; value: string; href?: string }[];
    }
  /**
   * 주요 기능(11-13 A안): 왼쪽 기능 목록에서 하나를 고르면 설명이 펼쳐지고 오른쪽 그림이 바뀐다(좁은 화면은 목록 아래 그림). FeatureShowcase.tsx
   * media.src는 public/ 아래 주소(예: /img/nanaki-sync.webp). 없으면 빈 자리에 placeholder 글자가 보인다.
   * media.alt는 그림에 보이는 것을 글로(스크린리더용). media.still은 움직임 줄이기 설정에서 대신 보이는 멈춘 한 장.
   * 움직이는 그림은 scripts/build-demos.mjs가 GIF 원본(private/img/demos/)을 animated WebP로 굽는다.
   */
  | {
      type: 'features';
      heading: string;
      /**
       * 그림 칸 크기(px). 없으면 시안의 가로 칸 248×150.
       * nanaki는 폰 화면 녹화(420×850)라 가로 칸에 넣으면 가운데 띠만 보인다 → 같은 비율의 세로 칸(11-13).
       */
      mediaSize?: { w: number; h: number };
      /**
       * 있으면 그림을 휴대폰 틀 안에 넣는다(11-13). mediaSize는 틀 안 화면(녹화) 크기다.
       * statusBar: 녹화 위에 덧붙이는 상태 표시줄 띠의 색. 녹화 맨 윗줄 색과 맞춘다(앱 바탕색).
       */
      phoneFrame?: { statusBar: string };
      items: readonly {
        title: string;
        desc: string;
        /** 그림이 아직 없을 때 빈 자리 안 글자 */
        placeholder: string;
        media?: { src: string; alt: string; still?: string };
      }[];
    }
  /**
   * 이름표 줄(사용 기술). TODO로 시작하는 항목은 점선 테두리 빈칸.
   * 11-13: 분류별 줄(groups). label이 있으면 "분류 | 이름표들" 표로, 없으면 이름표만 한 줄로 그린다.
   */
  | {
      type: 'tags';
      heading: string;
      groups: readonly { label?: string; items: readonly string[] }[];
    }
  /**
   * 디자인 시스템 요약 표: 색 견본 · 글꼴 · 컴포넌트. 머리글 오른쪽에 바깥 링크 하나.
   * colors의 hex가 TODO면 점선 빈 칸, 아니면 그 색으로 칠한 칸(글자로도 값을 적어 색만으로 전하지 않는다).
   */
  | {
      type: 'designSystem';
      heading: string;
      link: { label: string; href: string };
      /**
       * 견본마다 이름 + 라이트 값(hex) + 다크 값(dark, 선택). dark가 있으면 견본 칸을 반씩(왼쪽 라이트 · 오른쪽 다크) 칠한다.
       * darkLabel: 다크 값 앞에 붙는 말. note: 견본으로 그리지 않는 색(바탕·글자)을 글로 한 줄.
       */
      colors: {
        label: string;
        darkLabel: string;
        items: readonly { name: string; hex: string; dark?: string }[];
        note?: string;
      };
      /** note: 값 아래 작은 글씨 한 줄(크기 단계 등) */
      typography: { label: string; value: string; note?: string };
      /** note: 이름표 아래 작은 글씨(어디에 있고 무엇 기반인지) */
      components: { label: string; note?: string; items: readonly string[] };
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
      items: readonly { period: string; title: string; current?: boolean }[];
    }
  /**
   * 첫 작업물 한 칸(ABOUT ME, 11-13): 트랙색 레인 띠 안 제목 → 픽셀 모니터 속 영상(가로 전체) → 글 → 바깥 링크와 덧붙임 한 줄.
   * video.sources는 앞에서부터 브라우저가 읽을 수 있는 첫 형식이 재생된다. poster는 재생 전·움직임 줄이기 설정에서 보이는 첫 장면.
   * 파일은 scripts/build-first-portfolio.mjs가 그 사이트를 녹화해 만든다. alt는 영상에 보이는 것을 글로.
   * body의 빈 줄(\n\n)은 문단 나눔. note는 링크 옆 작은 글씨.
   */
  | {
      type: 'origin';
      title: string;
      body: string;
      note?: string;
      link: { label: string; href: string };
      video: {
        sources: readonly { src: string; type: string }[];
        poster: string;
        alt: string;
      };
    }
  /** 강조 상자 한 칸. eyebrow·title이 있으면 본문 위에 작은 머리글과 제목을 붙인다 */
  | { type: 'callout'; eyebrow?: string; title?: string; body: string }
  /** 경력 요약 판: 왼쪽 어두운 칸(총 경력) + 오른쪽 소속과 항목들 */
  | {
      type: 'summary';
      total: { label: string; value: string; note: string };
      team: { label: string; value: string; note?: string };
      /** lines: 값이 여러 줄일 수 있다(재입사로 기간이 둘). badge는 그 줄 옆 작은 표시 */
      facts: readonly {
        label: string;
        lines: readonly { text: string; badge?: string }[];
      }[];
    }
  /** 나란한 카드들. body·note는 있는 카드만 */
  | {
      type: 'cards';
      items: readonly {
        eyebrow: string;
        title: string;
        /** 제목 옆 노란 표시 */
        badge?: string;
        body?: string;
        /** sub: 항목 뒤에 흐리게 붙는 보충 */
        bullets: readonly { text: string; sub?: string }[];
        note?: string;
      }[];
    }
  /** 사례별 단계 카드. 단계는 화살표로 이어지고 마지막 단계(결과)가 강조된다 */
  | {
      type: 'cases';
      heading: string;
      items: readonly {
        title: string;
        steps: readonly { label: string; body: string }[];
      }[];
    }
  /**
   * 개발 기록(DEV LOG, 11-16 사용자 시안 2차): 소개 한 줄 → 트랙 막대(기록 수만큼 눈금, 러너가 지금 보는 기록 눈금에 섬) → 기록 한 장 → 이전·다음.
   * 한 장: 남색 띠(LAP n/전체) → 제목 + 원문 링크 → PROBLEM · TRACE · FIX · RESULT · LEARNED 다섯 줄. LapLog.tsx
   * result: 전후 숫자가 있으면 compare(막대 길이는 after/before에서 나온다. 숫자로 적는 이유), 전후가 말이면 shift, 항목별 점수면 scores, 전후가 아닌 핵심 값이면 stats, 어느 것도 아니면 text(todo는 뒤에 붙는 모르는 값).
   * source는 원문 주소(PR·글). TODO면 링크가 아닌 빈칸 글자. 날짜·PR 번호는 표시하지 않는다(11-16 사용자 결정).
   */
  | {
      type: 'laps';
      intro: string;
      labels: {
        lap: string;
        source: string;
        problem: string;
        trace: string;
        fix: string;
        result: string;
        learned: string;
        before: string;
        after: string;
        /** 막대 앞 한 글자 */
        barBefore: string;
        barAfter: string;
        /** 이전·다음 버튼의 스크린리더 이름 앞말("Previous: LAP 5") */
        prev: string;
        next: string;
      };
      items: readonly {
        title: string;
        source: string;
        problem: string;
        trace: string;
        fix: string;
        result:
          | { kind: 'compare'; before: number; after: number; unit: string; caption: string }
          /** 숫자 대신 짧은 말 두 개를 전 → 후로 크게("5회 실패" → "11개 통과"). 막대는 없다(비율을 낼 숫자가 아니다) */
          | { kind: 'shift'; before: string; after: string; caption?: string }
          /** 여러 항목의 점수 전 → 후를 나란히(화면별 Lighthouse 점수). headline은 그 아래 한 줄 요약, caption은 덧붙임 */
          | {
              kind: 'scores';
              rows: readonly { label: string; before: number; after: number }[];
              headline: string;
              caption?: string;
            }
          /** 전후 비교가 아닌 핵심 값 몇 개를 나란히(이름 + 큰 값 + 무엇의 값인지 한 줄). headline·caption은 scores와 같다 */
          | {
              kind: 'stats';
              rows: readonly { label: string; value: string; note?: string }[];
              headline: string;
              caption?: string;
            }
          | { kind: 'text'; text: string; todo?: string };
        learned: string;
      }[];
    }
  /** 이름 | 설명 두 칸 표 */
  | { type: 'traits'; heading: string; items: readonly { tag: string; desc: string }[] }
  | { type: 'resume'; doc: ResumeDoc }
  /**
   * 기술 장비창(SKILLS, 11-12 사용자 시안 "SkillAtlas"): 가운데 러너를 위·왼쪽·오른쪽·아래 네 갈래가 둘러싼다.
   * 자리마다 갈래 하나(top·left·right·bottom). 가운데는 이름표와 함께 쓰는 AI 개발 도구(spotlight, 시안의 강화 연출 그대로, 11-12).
   */
  | {
      type: 'stack';
      groups: { top: StackGroup; left: StackGroup; right: StackGroup; bottom: StackGroup };
      /** 맨 위 범례 글자(아이콘 테두리 뜻). 항목마다 스크린리더용 숨은 글자로도 쓴다 */
      legend: { work: string; project: string };
      /** 러너 아래 이름표 */
      name: string;
      spotlight: { label: string; status: string; item: Omit<StackItem, 'desc' | 'use'> };
    };

/**
 * 이력서 한 장(RESUME, 11-12 사용자 시안). 머리(사진·이름·연락처) + 남색 띠 머리글로 나뉜 블록들.
 * 값이 TODO로 시작하면 화면에 "[나머지]" 회색 빈칸으로 보인다(시안의 [YYYY.MM] 표기). href가 TODO면 링크가 아닌 글자.
 */
export interface ResumeDoc {
  /** 위 띠 왼쪽 문서 이름(영어 픽셀) */
  badge: string;
  /** 최종 수정 연월 */
  updated: { label: string; value: string };
  /** fileName: 내려받을 때 저장되는 이름(주소의 resume.pdf 대신 사람이 알아보는 이름) */
  pdf: { label: string; href: string; fileName: string };
  /** public/img/{src}-320.webp·-640.webp(scripts/build-photos.mjs). 없으면 빈 사진 자리 */
  photo?: { src: string; alt: string };
  name: string;
  nameEn: string;
  role: string;
  info: readonly { label: string; value: string; href?: string; kind?: 'mail' | 'external' }[];
  profile: ResumeBar & { body: string };
  career: ResumeBar & {
    /** periods: 재입사로 기간이 둘일 수 있다(CAREER 창 요약 판과 같은 값). badge는 그 줄 옆 작은 표시 */
    items: readonly {
      periods: readonly { text: string; badge?: string }[];
      /** 기간 아래 작은 글자: 두 기간을 더한 총 경력(11-18). CAREER 창 요약 판의 TOTAL과 같은 값이어야 한다 */
      duration: string;
      title: string;
      org: string;
      bullets: readonly string[];
    }[];
  };
  skills: ResumeBar & {
    rows: readonly { label: string; items: readonly string[]; learning?: string }[];
  };
  /** 학력과 교육을 한 섹션으로(11-12): 기간 | 이름 + 기관 */
  education: ResumeBar & { items: readonly ResumeRow[] };
  /** 자격증도 같은 줄 모양(11-12): period = 취득 연월, desc = 발행기관 */
  license: ResumeBar & { items: readonly ResumeRow[] };
  other: ResumeBar & {
    /** 기간 아래 근무 기간, 회사명 옆 직책, 아래 설명(있는 것만). 11-12 사용자 시안 */
    items: readonly {
      period: string;
      duration: string;
      org: string;
      role: string;
      desc?: string;
    }[];
  };
}
/** 남색 띠 머리글: 영어 픽셀 eyebrow + 한국어 제목 */
interface ResumeBar {
  eyebrow: string;
  title: string;
}
interface ResumeRow {
  period: string;
  title: string;
  desc: string;
}

/**
 * 기술 칸 하나. icon은 public/icons/tech/ 안의 파일 이름(scripts/build-tech-icons.mjs가 굽는다).
 * 실제 로고를 쓴다(11-12 사용자 결정, CLAUDE.md의 "브랜드 로고 금지"는 러닝 브랜드 얘기라 기술 스택 아이콘은 예외).
 * desc는 할 수 있는 범위 한 줄(항상 보인다). TODO로 시작하면 회색.
 */
export interface StackItem {
  name: string;
  /** 어디서 썼나(11-17): work = 회사 실무, project = 개인 프로젝트. 아이콘 테두리 모양이 달라진다 */
  use: 'work' | 'project';
  icon: string;
  desc: string;
}
export interface StackGroup {
  label: string;
  items: readonly StackItem[];
}

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
        title: '호기심에서 시작해,\n결과물로 완성합니다.',
        body: '트랙 위 캐릭터는 첫 러닝 대회 날의 저를 그대로 옮긴 거예요. 이 사이트도 같은 마음으로 만들었습니다. 궁금한 건 직접 만들어 보고, 만든 건 기록으로 남깁니다.',
      },
      {
        type: 'starts',
        heading: '세 번 출발선에 섰습니다',
        items: [
          {
            period: '2013~2018',
            title: '브랜드의류 스토어매니저',
          },
          {
            period: '2018~2022',
            title: '공인중개사사무소 대표',
          },
          {
            period: '2023~',
            title: '프론트엔드 개발자',
            current: true,
          },
        ],
      },
      // 11-17 되살림: 11-13에 뺐더니 출발선 3칸(트랙 선)만 남아 허전했다(사용자). 문구는 뺄 때 그대로
      {
        type: 'callout',
        body: '서른셋, 처음으로 코드를 배우기 시작했습니다.\n다양한 현장에서 쌓은 경험은 사용자의 불편함과 필요를 먼저 살피는 시각이 되었습니다.\n출발이 늦은 대신 한 바퀴를 어떻게 완주해야 하는지는 압니다.',
      },
      {
        type: 'origin',
        title: 'FIRST PORTFOLIO(2023) - 마크업에서 시작해, 인터랙션까지',
        // 세 문단(처음 만난 코드 → 그래서 한 일 → 지금까지 남은 것). 항목 하나가 한 문단. 줄바꿈 하나로 잇는다(문단 사이를 띄우려면 '\n\n')
        body: [
          '2023년, 웹 퍼블리셔 학원에서 처음 코드를 접했습니다. Photoshop이나 Figma 같은 디자인 툴보다, 머릿속으로 상상한 화면이 코드 몇 줄로 실제 움직이는 과정이 훨씬 흥미로웠습니다.',
          '그 흥미를 계기로 학원 커리큘럼에서 비중이 거의 없던 JavaScript를 따로 공부했고, 직접 포트폴리오를 만들어 프론트엔드 개발자로 첫발을 내디뎠습니다. 위 사이트가 바로 그때 만든 첫 포트폴리오입니다.',
          '당시 고민했던 시맨틱 마크업과 반응형 웹에 대한 기초는 지금도 컴포넌트와 UI 구조를 설계할 때 중요한 출발점이 되고 있습니다.',
        ].join('\n'),
        note: '사이트는 데스크톱 전용이고 게시된 작업물은 반응형입니다.',
        link: { label: '당시 사이트', href: 'https://ryeong-portfolio.netlify.app/' },
        video: {
          // 브라우저는 앞에서부터 재생할 수 있는 첫 형식을 고른다. MP4(H.264)가 앞: 사파리도 재생하고 파일도 훨씬 작다(163KB, WebM 937KB)
          sources: [
            { src: '/video/first-portfolio.mp4', type: 'video/mp4' },
            { src: '/video/first-portfolio.webm', type: 'video/webm' },
          ],
          poster: '/img/first-portfolio-poster.webp',
          alt: '첫 포트폴리오 사이트의 첫 화면. 물결치는 바다 위로 홍학 튜브와 홍학이 흔들리고 가운데에 "RYEONG\'S PORTFOLIO" 글자가 나타난다',
        },
      },
      {
        type: 'traits',
        heading: '저는 이런 사람이에요',
        items: [
          {
            tag: '커뮤니케이션이 원활한 사람',
            desc: '코드보다 먼저 말로 설명할 수 있어야 한다고 믿습니다. 리뉴얼한 화면 20개에 매뉴얼을 붙였더니, 영업자가 마트를 직접 찾아가 이용법을 설명해야 하는 일이 줄었습니다.',
          },
          {
            tag: '일단 실행하는 사람',
            desc: '불편하거나 잘못된 부분을 발견하면 개선부터 시작합니다. 문자 바이트 계산 오류를 직접 수정하고 발송 전 미리보기 기능을 추가했습니다. 이후 단문문자를 이용하고도 장문문자 요금이 청구됐다는 고객 불만이 사라졌습니다.',
          },
          {
            tag: '최신 기술 트렌드에 적극적인 사람',
            desc: '실무의 주력은 jQuery와 PHP 템플릿이었지만, 사이드 프로젝트에서는 Next.js·TypeScript·Supabase·Docker 등을 써 보며 익혔습니다.',
          },
          {
            tag: '꾸준히 배우고, 끝까지 해내는 사람',
            desc: '러닝대회 완주도, 개발 공부도 제 속도에 맞춰 꾸준히 이어가고 있습니다. 조급하게 앞서가기보다 기본을 탄탄히 다지고, 배운 것을 직접 적용하며 성장하는 과정을 중요하게 생각합니다.',
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
        type: 'summary',
        total: { label: 'TOTAL', value: '2년 9개월', note: '의 실무 경험' },
        team: { label: 'TEAM', value: '파워정보통신', note: '(구 파워텔레콤)' },
        facts: [
          { label: 'POSITION', lines: [{ text: 'Frontend Developer' }] },
          {
            label: 'PERIOD',
            lines: [{ text: '2023.09 – 2025.09' }, { text: '2025.12 – 2026.07', badge: '재입사' }],
          },
        ],
      },
      {
        type: 'text',
        body: 'B2B 문자 발송 서비스의 웹 프론트엔드를 전담하며 주요 서비스 화면과 관리자 어드민을 개발했습니다.',
      },
      {
        type: 'callout',
        eyebrow: 'MY ROLE',
        title: '기획부터 구현까지, 주도적으로 완성하는 역할',
        body: '정해진 화면을 구현하는 데 그치지 않고 서비스의 방향과 필요한 기능을 고민하며, 기획·화면 설계·퍼블리싱·프론트엔드 개발까지 폭넓게 수행했습니다.',
      },
      {
        type: 'cards',
        items: [
          {
            eyebrow: 'MAIN SERVICE',
            title: 'B2B 문자 발송 서비스',
            bullets: [
              { text: '문자 발송 및 수신자 관리 화면 개발' },
              { text: '발송 결과 조회 및 관련 UI 구현' },
              { text: '서비스 운영을 위한 관리자 어드민 개발' },
            ],
          },
          {
            eyebrow: 'NEW SERVICE PROJECTS',
            title: '신규 웹 서비스 5건 구축',
            badge: '5건 중 1건 출시',
            body: '웹툰·협회·강의 플랫폼 등 신규 서비스를 기획은 팀과 함께, 디자인부터 프론트엔드 구현까지는 혼자 맡았습니다.',
            bullets: [
              { text: '서비스 기획 및 화면 구성', sub: '(팀과 함께)' },
              { text: 'UI 디자인 및 웹 퍼블리싱' },
              { text: '프론트엔드 개발' },
            ],
          },
        ],
      },
      {
        type: 'cases',
        heading: '문제해결기록',
        items: [
          {
            title: '리디자인 20개 화면',
            steps: [
              {
                label: '문제',
                body: '파일마다 스타일과 jQuery가 섞여 있어 화면마다 모양이 다르고 수정이 느렸다',
              },
              { label: '해결', body: '공통 CSS·JS로 분리하고 영업자용 매뉴얼을 같이 만들었다' },
              {
                label: '결과',
                body: '영업자가 마트를 찾아가 설명하는 일이 줄고, 떠났던 마트가 돌아왔다',
              },
            ],
          },
          {
            title: '바이트 계산 버그와 미리보기',
            steps: [
              {
                label: '문제',
                body: 'SMS/LMS 바이트 계산이 틀려 요금이 다르게 나가거나 글자가 잘렸다',
              },
              { label: '해결', body: '계산 로직을 고치고 발송 전 미리보기를 붙였다' },
              { label: '결과', body: '문의가 줄고, 발송 전 확인 단계가 생겼다' },
            ],
          },
        ],
      },
    ],
  },

  project1: {
    id: 'project1',
    title: 'nanaki',
    subtitle: '나는 나를 키운다',
    sections: [
      {
        type: 'quest',
        title: '프로젝트 소개',
        // 네 문단(무엇인가 → 바로 써 보기 → 할 수 있는 것 → 설정·백업). 항목 하나가 한 문단이고, 빈 줄로 이어 붙이면 Sections.tsx Quest가 whitespace-pre-line으로 나눠 그린다
        body: [
          'nanaki는 가계부·후기·운동·루틴·체형을 하나의 캘린더에 기록하는 자기관리 PWA(Progressive Web Apps)입니다. 휴대폰 홈 화면에 설치해 앱처럼 쓰고, PC 브라우저에서는 목록과 상세를 나란히 보는 넓은 화면으로 바뀝니다.',
          '"로그인 없이 체험하기"를 누르면 예시 기록이 들어 있는 계정으로 바로 둘러볼 수 있습니다.',
          '다섯 종류 기록마다 예산, 별점·사진, 알림, 눈바디 비교처럼 그 기록에 맞는 도구가 붙어 있습니다. 기록 탭에서는 이번 달 합계와 지난달 비교를 종류별로 보고, 기간을 골라 보고서로 만들어 PDF로 저장할 수 있습니다.',
          '설정에서 쓰지 않는 기록 종류는 끌 수 있고(기록은 지워지지 않고 숨겨짐), 모든 기록을 파일로 백업하거나 다시 불러올 수 있습니다.',
        ].join('\n\n'),
        facts: [
          { label: '기간', value: '2026.10.19 – 2026.10.26' },
          { label: '기여도', value: '100% · 개인프로젝트' },
          {
            label: 'GitHub',
            value: 'https://github.com/Zzal1225/nanaki',
            href: 'https://github.com/Zzal1225/nanaki',
          },
          {
            label: '배포',
            value: 'https://nanaki-two.vercel.app/',
            href: 'https://nanaki-two.vercel.app/',
          },
        ],
      },
      {
        type: 'features',
        heading: '주요 기능',
        mediaSize: { w: 260, h: 526 },
        phoneFrame: { statusBar: '#F4F4F6' },
        items: [
          {
            title: '오프라인 기록 동기화',
            desc: '모든 기록을 기기(IndexedDB)에 먼저 저장하고, 오프라인에서 쓴 기록은 대기열(outbox)에 두었다가 연결되면 자동으로 보냅니다. 서비스 워커가 화면을 미리 받아 두어 한 번도 연 적 없는 화면도 오프라인에서 열립니다.',
            placeholder: '기능 1 시연 GIF',
            media: {
              src: '/img/nanaki-offline-sync.webp',
              still: '/img/nanaki-offline-sync-still.webp',
              alt: '비행기 모드에서 가계부 기록을 저장하자 "저장 대기" 표시가 붙고, 다시 연결되자 표시가 사라지는 nanaki 화면',
            },
          },
          {
            title: 'AI 챗봇 나키 — 자연어를 검색 조건으로',
            desc: '질문을 서버 어댑터가 필터 JSON으로 바꾸고 Zod로 검증한 뒤, 합계·건수·평균은 기기에서 계산합니다. 질문과 켜진 타입의 필드 정의(이름·종류·기본 선택지)와 사용자가 만든 분류·태그 이름만 Next.js Route Handler를 거쳐 AI에 보냅니다. 기록 내용(금액·메모·제목·날짜·건수)은 보내지 않습니다. 이어 물으면 바로 앞 질문 하나의 문장과 나키가 이해한 조건을 함께 보내고, 그 답은 보내지 않습니다. 이해한 조건을 칩으로 보여 줘, 사용자가 그대로 기록 탭으로 가져가 수정·재검색할 수 있습니다.',
            placeholder: '기능 2 시연 GIF',
            media: {
              src: '/img/nanaki-naki-ai.webp',
              still: '/img/nanaki-naki-ai-still.webp',
              alt: '나키에게 "지난달 외식비 얼마였어?"라고 묻자 가계부 · 2026년 10월 · 분류 식비 조건 칩과 합계 -48,800원이 나오고, 같은 조건으로 기록 탭이 열리는 화면',
            },
          },
          {
            title: '필드 정의 하나로 그리는 폼·필터',
            desc: '타입별 필드를 스키마 하나로 선언하면 작성 폼·필터·목록 카드·AI 검색 조건이 모두 거기서 만들어집니다. 체형 타입을 추가할 때 폼·목록 컴포넌트는 한 줄도 고치지 않았습니다.',
            placeholder: '기능 3 시연 GIF',
            media: {
              src: '/img/nanaki-schema-form.webp',
              still: '/img/nanaki-schema-form-still.webp',
              alt: '더하기 버튼에서 가계부 · 운동 · 체형을 차례로 고르면 타입마다 다른 입력 칸으로 작성 폼이 바뀌는 화면',
            },
          },
          {
            title: '다크모드 · 디자인 토큰',
            desc: '색은 의미 토큰(fg-primary, type-expense)만 쓰기 때문에 다크모드는 CSS 변수 값만 바뀌고 컴포넌트는 그대로입니다. 기기 설정을 따라 즉시 전환되고, 화면 비교 스냅샷 36장으로 라이트·다크 회귀를 막습니다.',
            placeholder: '기능 4 시연 GIF',
            media: {
              src: '/img/nanaki-dark-mode.webp',
              still: '/img/nanaki-dark-mode-still.webp',
              alt: '홈 화면 아이콘으로 nanaki를 열고, 기기를 다크 모드로 바꾸자 캘린더와 요약 화면이 어두운 색으로 바뀌는 화면',
            },
          },
        ],
      },
      {
        type: 'tags',
        heading: '사용 기술',
        groups: [
          { label: '프레임워크', items: ['Next.js 16 (App Router)', 'React 19', 'TypeScript'] },
          {
            label: '상태·데이터',
            items: ['TanStack Query', 'Zustand', 'React Hook Form', 'Zod'],
          },
          {
            label: '오프라인·PWA',
            items: ['Dexie (IndexedDB)', 'Serwist (Service Worker)', 'Web Push'],
          },
          { label: 'UI', items: ['Tailwind CSS v4', 'Radix UI', 'date-fns'] },
          {
            label: '백엔드',
            items: ['Supabase', 'Vercel AI SDK (Gemini)'],
          },
          { label: '테스트', items: ['Vitest', 'Testing Library', 'MSW', 'Playwright'] },
          { label: '운영', items: ['GitHub Actions', 'Lighthouse CI', 'Sentry', 'Vercel'] },
        ],
      },
      {
        type: 'designSystem',
        heading: '디자인 시스템',
        // nanaki는 Figma·Storybook 대신 앱 안에 디자인 시스템 페이지(/design-system)를 뒀다. 아래는 요약이고 전체는 링크로 본다(11-13 사용자 작성 값).
        link: { label: '전체 보기', href: 'https://nanaki-two.vercel.app/design-system' },
        colors: {
          label: 'Color',
          darkLabel: '다크',
          items: [
            { name: '메인컬러', hex: '#2E7D4F', dark: '#6CC08F' },
            { name: '가계부', hex: '#8A6700', dark: '#E0B44A' },
            { name: '후기', hex: '#C2365F', dark: '#E68DA7' },
            { name: '운동', hex: '#2562C4', dark: '#86AAEB' },
            { name: '체형', hex: '#097078', dark: '#62C2C2' },
            { name: '루틴', hex: '#8A3FC0', dark: '#D7BFF4' },
          ],
        },
        typography: {
          label: 'Typography',
          value: 'Pretendard',
          note: '크기 단계: 12 · 14 · 16 · 20 · 24 · 28 · 32',
        },
        components: {
          label: 'Components',
          note: 'src/shared/ui, 모두 Radix 기반',
          items: ['Button', 'TextField', 'Card', 'Sheet'],
        },
      },
    ],
  },

  /**
   * DEV LOG(11-16 사용자 결정·시안 2차): PROJECT2(dahda) 자리를 nanaki 개발 기록 창으로 바꿨다. id는 project2 그대로(menu.ts 주석).
   * 부제목 없이 "DEV LOG"만. 기록 하나가 한 바퀴(LAP)이고 한 번에 한 장씩 넘겨 본다.
   * 문구는 사용자가 nanaki의 docs/devlog 글 5편을 요약해 채웠다(source가 그 글 주소). RESULT 모양은 기록마다 다르다(compare·shift·scores·stats).
   * 기록을 더하려면 items에 한 칸을 더한다(번호·눈금·점은 개수에서 나온다).
   */
  project2: {
    id: 'project2',
    title: 'DEV LOG',
    sections: [
      {
        type: 'laps',
        // 러너의 말풍선 안 글(11-16)
        intro: '개인프로젝트 nanaki를 만들며 부딪힌 문제를 기록했어요!',
        labels: {
          lap: 'LAP',
          source: '원문 보기',
          problem: 'PROBLEM',
          trace: 'TRACE',
          fix: 'FIX',
          result: 'RESULT',
          learned: 'LEARNED',
          before: 'BEFORE',
          after: 'AFTER',
          barBefore: 'B',
          barAfter: 'A',
          prev: 'Previous',
          next: 'Next',
        },
        items: [
          {
            title: '60초 재조회 로직이 만든 성능 병목',
            source: 'https://github.com/Zzal1225/nanaki/blob/main/docs/devlog/01-sync.md',
            problem:
              '기록 1만 건을 가진 계정에서 모든 화면의 재방문 시간이 약 3.3초로 증가했다. 동기화가 진행되는 동안 화면 진입이 지연됐다.',
            trace:
              '동기화 시 마지막 수신 시각보다 60초 앞서 데이터를 재조회하는 안전장치가 원인이었다. 대량으로 저장된 1만 건이 매번 재다운로드되고 있었다.',
            fix: '60초 재조회 안전장치를 유지하면서 유효기간과 확정 조건을 추가했다. 재조회가 완료된 이후에는 마지막 수신 시각 이후의 변경 데이터만 가져오도록 개선했다.',
            result: {
              kind: 'compare',
              before: 3.26,
              after: 0.93,
              unit: 's',
              caption:
                '1만 건에서도 300건 비교군과 유사한 성능을 확보하고, 경계 조건 검증을 위한 단위 테스트 4개를 추가했다.',
            },
            learned:
              '데이터가 많다는 직관보다 비교군과 측정값으로 병목을 검증하고, 안전장치에도 명확한 종료 조건이 필요하다는 점을 배웠다.',
          },
          {
            title: '한 번도 열지 않은 화면의 오프라인 지원',
            source: 'https://github.com/Zzal1225/nanaki/blob/main/docs/devlog/02-offline.md',
            problem:
              '인터넷 연결이 끊긴 상태에서 한 번도 방문하지 않은 기록 상세·수정·작성 화면이 열리지 않았다. 미리 화면을 저장하는 방식으로 해결하려 했지만 E2E 테스트가 5회 연속 실패했다.',
            trace:
              '실패할 때마다 서비스 워커 캐시, 화면 사전 다운로드, 테스트 대기 조건, 정적 렌더링 등 서로 다른 원인이 발견됐다. 특히 기록 ID가 URL 경로에 포함되어 화면 틀을 재사용할 수 없는 구조가 핵심 문제였다.',
            fix: '기록 ID를 경로(/records/:id)에서 쿼리스트링(/records/view?id=:id)으로 이동해 화면 틀을 공통화했다. 서비스 워커 캐시 판별과 다운로드 검증 로직을 수정하고, 타입별 화면은 정적 생성으로 전환했다.',
            result: {
              kind: 'shift',
              before: 'CI 5회 실패',
              // 줄바꿈 자리를 정해 둔다: 맡겨 두면 PC에서 "…11개 / 통과"로 끊긴다
              after: '오프라인 시나리오\n11개 통과',
              caption:
                '기록 상세·수정·타입별·작성 화면의 오프라인 접근을 구현했다. 기존 URL은 자동 리다이렉트해 호환성을 유지했다.',
            },
            learned:
              '오프라인 지원은 캐싱만으로 완성되지 않는다. 재사용 가능한 화면 구조, 정적 렌더링, 실제 캐시 상태를 검증하는 테스트까지 함께 설계해야 한다는 점을 배웠다.',
          },
          {
            title: 'Lighthouse 90+ 달성, 핵심은 LCP 요소였다',
            source: 'https://github.com/Zzal1225/nanaki/blob/main/docs/devlog/03-lighthouse.md',
            problem:
              '배포 환경의 모바일 Lighthouse 점수가 홈·기록 탭 모두 74점으로 목표인 90점에 미달했다. 실제 화면은 빠르게 그려지지만 추정 LCP는 6~7초까지 측정됐다.',
            trace:
              '글꼴·서버 요청 차단 실험으로 원인을 좁혔다. LCP 후보 전체를 추적한 결과, 투명도 0에서 시작하는 로고가 측정 대상에서 누락되고 작은 글자 하나가 LCP로 잡히는 문제를 발견했다.',
            fix: '로고의 초기 투명도를 0 → 0.01로 변경하고, 로그인 JS 코드와 Sentry를 지연 로딩했다. 기록 탭은 로딩 중에도 동일한 카드 틀을 먼저 렌더링하도록 개선했다.',
            result: {
              kind: 'scores',
              rows: [
                { label: '로그인', before: 87, after: 99 },
                { label: '홈', before: 74, after: 95 },
                { label: '기록 탭', before: 74, after: 92 },
              ],
              headline: '3개 화면 모두 Lighthouse 90+ 달성',
              caption:
                '추정 LCP도 로그인 3.77 → 1.98초, 홈 6.35 → 2.66초, 기록 탭 7.02 → 2.87초로 개선했다.',
            },
            learned:
              '성능 최적화는 용량 감축만이 답이 아니다. 측정 지표가 무엇을 기준으로 계산되는지 파악하고, 실험으로 효과를 검증한 뒤 개선 우선순위를 정하는 것이 중요하다.',
          },
          {
            title: 'AI에 무엇을 보내고 무엇을 기기에서 처리할까?',
            source: 'https://github.com/Zzal1225/nanaki/blob/main/docs/devlog/04-naki.md',
            problem:
              'AI 챗봇이 소비 기록에 답하려면 데이터 조회가 필요했지만, 금액·메모·제목 등 개인정보를 외부 AI 서버로 보내지 않는 것이 목표였다. 동시에 사용자가 직접 만든 분류와 태그도 정확하게 검색해야 했다.',
            trace:
              '기록 데이터를 보내지 않자 AI가 사용자가 직접 만든 분류명(예: OTT)을 인식하지 못했다. 기록 내용까지 전송하는 방법도 검토했지만 개인정보 보호 원칙과 충돌했다.',
            fix: 'AI는 통역사로서 자연어 질문을 검색 조건으로 변환하고, 앱은 해당 조건을 검증한 뒤 기기 내 데이터에서 검색·계산하는 사서 역할로 분리했다. 정확도를 위해 사용자 정의 분류·태그 이름만 각각 최대 50개까지 추가 전송하고, AI가 생성한 조건은 검증 후 기존 검색 로직에서 처리했다.',
            result: {
              kind: 'stats',
              rows: [
                { label: 'AI 전송 데이터', value: '이름만', note: '분류·태그 각 최대 50개' },
                { label: '기기 내 처리', value: '100%', note: '기록 검색 및 계산' },
              ],
              headline: '큰 모델 대신 응답 시간이 짧은 Lite 모델을 기본 적용 (약 1초)',
              caption:
                '사용자 정의 분류·태그 검색, 기간 비교, 이어 묻기 기능을 구현했다. 답변마다 검색 조건을 표시하고 기존 기록 검색 화면과 동일한 결과를 제공하도록 했다.',
            },
            learned:
              'AI 기능의 핵심은 모델 호출보다 데이터 경계를 설계하는 데 있다. AI의 역할을 조건 생성으로 제한하고, 검증·검색·계산은 기존 앱 로직에 맡기면 개인정보 노출을 줄이면서 결과의 일관성도 확보할 수 있다.',
          },
          {
            title: '자동화할 것과 아이폰에서만 볼 것을 나누기',
            source: 'https://github.com/Zzal1225/nanaki/blob/main/docs/devlog/05-test-strategy.md',
            problem:
              '자동 테스트가 모두 초록불인데 아이폰에서 직접 써 보니 버그 6건이 나왔다. 작성 화면이 홈으로 튕기고, 입력칸을 누르면 화면이 확대되고, 하단 탭이 키보드 위에 떠 있는 등의 버그였다.',
            trace:
              '화면을 주소로 직접 열고, 실패 상황은 단위 테스트로만 확인했으며, 기능 흐름 테스트도 PC 화면 크기에 한정되어 있었다. 실제 사용자 이동 경로와 모바일 환경을 테스트하지 않은 것이 원인이었다.',
            fix: 'Playwright에 모바일 크기·터치 검사와 화면 이동 시나리오를 추가하고, 서버 실패·WebKit 테스트를 보강했다. 기기에서만 확인 가능한 항목은 10분 체크리스트로 분리했다.',
            result: {
              kind: 'shift',
              // 줄바꿈 자리를 정해 둔다(쉼표 뒤)
              before: '버그 6건,\n자동 테스트 전부 초록불',
              after: '같은 종류 재발 0건',
              caption: 'PR #76 이후 재발 없음 · 단위 855 · 통합 70 · E2E 33',
            },
            learned:
              '기기 고유 문제와 테스트 누락을 구분해야 한다. 자동화 가능한 검사는 CI에 맡기고, 실제 기기에서만 확인할 항목은 체크리스트로 관리하는 것이 지속 가능한 테스트 전략이라는 점을 배웠다.',
          },
        ],
      },
    ],
  },

  skill: {
    id: 'skill',
    title: 'SKILLS',
    sections: [
      {
        type: 'stack',
        groups: {
          top: {
            label: '언어 · 마크업',
            items: [
              {
                name: 'HTML',
                use: 'work',
                icon: 'html5.svg',
                desc: '시맨틱 마크업과 웹 표준을 준수',
              },
              {
                name: 'CSS',
                use: 'work',
                icon: 'css3.svg',
                desc: '반응형 레이아웃 및 애니메이션 구현',
              },
              {
                name: 'JS',
                use: 'work',
                icon: 'javascript.svg',
                desc: 'DOM·이벤트·비동기 직접 구현',
              },
              {
                name: 'TS',
                use: 'project',
                icon: 'typescript.svg',
                desc: '타입·Zod로 데이터 검증',
              },
              {
                name: 'PHP',
                use: 'work',
                icon: 'php.svg',
                desc: 'include를 활용한 공통 레이아웃 구성 및 관리',
              },
            ],
          },
          left: {
            label: '라이브러리 · 프레임워크',
            items: [
              {
                name: 'React',
                use: 'work',
                icon: 'react.svg',
                desc: '미출시 신규 서비스에서 AI와 함께 컴포넌트·Hooks 기반 UI 구현',
              },
              {
                name: 'Next.js',
                use: 'project',
                icon: 'nextjs.svg',
                desc: 'App Router 기반 페이지 구성 및 서버 데이터 연동',
              },
              {
                name: 'jQuery',
                use: 'work',
                icon: 'jquery.svg',
                desc: 'AJAX 통신과 DOM 이벤트를 활용한 레거시 UI 구현',
              },
              {
                name: 'Tailwind',
                use: 'project',
                icon: 'tailwindcss.svg',
                desc: '유틸리티 클래스를 활용한 빠른 UI 및 반응형 구현',
              },
            ],
          },
          right: {
            label: '상태관리 · 서버',
            items: [
              {
                name: 'Zustand',
                use: 'project',
                icon: 'zustand.png',
                desc: '전역 상태 및 컴포넌트 간 데이터 공유',
              },
              {
                name: 'Supabase',
                use: 'project',
                icon: 'supabase.svg',
                desc: '인증·데이터베이스 연동 및 CRUD 구현',
              },
              {
                name: 'Docker',
                use: 'project',
                icon: 'docker.svg',
                desc: '컨테이너 기반 개발 환경 구성 및 실행',
              },
            ],
          },
          bottom: {
            label: '테스트 · 배포',
            items: [
              {
                name: 'Playwright',
                use: 'project',
                icon: 'playwright.svg',
                desc: '브라우저 기반 E2E 테스트',
              },
              {
                name: 'Vitest',
                use: 'project',
                icon: 'vitest.svg',
                desc: '함수·컴포넌트 단위 테스트',
              },
              {
                name: 'GitHub Actions',
                use: 'project',
                icon: 'githubactions.svg',
                desc: 'PR마다 테스트·Lighthouse CI 실행',
              },
              {
                name: 'Vercel',
                use: 'project',
                icon: 'vercel.svg',
                desc: 'GitHub 연동 자동 배포 및 서비스 운영',
              },
            ],
          },
        },
        // 범례(11-17 사용자 시안): 아이콘 테두리로 "어디서 썼나"를 나눈다
        legend: { work: '실무 사용 경험', project: '프로젝트 사용 경험' },
        name: 'ChanRyeongPark',
        spotlight: {
          label: 'AI CODING AGENT',
          status: 'PAIRING',
          item: { name: 'Claude Code', icon: 'claudecode.svg' },
        },
      },
    ],
  },

  resume: {
    id: 'resume',
    title: 'RESUME',
    sections: [
      {
        type: 'resume',
        doc: {
          badge: 'RESUME',
          updated: { label: '최종 수정', value: '2026.11.17' },
          // PDF는 이 내용으로 굽는다: node scripts/build-resume-pdf.mjs (내용을 고치면 다시 실행)
          pdf: {
            label: 'PDF로 받기',
            href: '/resume.pdf',
            fileName: '박찬령_프론트엔드_이력서.pdf',
          },
          photo: { src: 'resume', alt: '검은 재킷을 입은 박찬령의 증명사진' },
          name: '박찬령',
          nameEn: 'ChanRyeong Park',
          role: '프론트엔드 개발자',
          info: [
            { label: '생년월일', value: '1990.12.25' },
            { label: '연락처', value: '010-7540-9538' },
            {
              label: '이메일',
              value: 'pakcam35@naver.com',
              href: 'mailto:pakcam35@naver.com',
              kind: 'mail',
            },
            {
              label: 'GitHub',
              value: 'github.com/Zzal1225',
              href: GITHUB,
              kind: 'external',
            },
            {
              label: '포트폴리오',
              value: 'portfolio2026fixel.vercel.app',
              href: 'https://portfolio2026fixel.vercel.app',
              kind: 'external',
            },
          ],
          profile: {
            eyebrow: 'PROFILE',
            title: '자기소개',
            body: '사용자가 "자연스럽다"고 느끼는 화면을 만드는 데 관심이 많은 프론트엔드 개발자입니다. 마트를 주 고객으로 하는 문자 발송 서비스의 웹 프론트를 맡아, 제각각이던 사이트 약 20개 화면을 다시 설계하고 공통 스타일로 정리해 고객 이탈을 되돌린 경험이 있습니다. 매장 매니저와 공인중개사로 고객을 직접 만나 온 덕분에, 화면을 쓰는 사람이 어디서 막히는지부터 봅니다.',
          },
          career: {
            eyebrow: 'CAREER',
            title: '경력',
            items: [
              {
                periods: [
                  { text: '2023.09 ~ 2025.09' },
                  { text: '2025.12 ~ 2026.07', badge: '재입사' },
                ],
                duration: '총 2년 9개월',
                title: '프론트엔드 웹 개발자',
                org: '파워정보통신',
                bullets: [
                  'B2B 문자 발송 서비스 웹 프론트엔드 전담(서비스 화면·관리자 어드민)',
                  '신규 웹 서비스 5건 디자인·프론트엔드 구현(1건 출시)',
                ],
              },
            ],
          },
          skills: {
            eyebrow: 'SKILLS',
            title: '보유 기술',
            rows: [
              {
                label: '언어 · 마크업',
                items: ['HTML', 'CSS/SCSS', 'JavaScript', 'TypeScript', 'PHP'],
              },
              {
                label: '라이브러리 · 프레임워크',
                items: ['React', 'Next.js', 'jQuery', 'Tailwind CSS'],
              },
              { label: '상태관리 · 서버', items: ['Zustand', 'Supabase', 'Docker'] },
              {
                label: '테스트 · 배포',
                items: ['Playwright', 'Vitest', 'GitHub Actions', 'Vercel'],
                learning: '학습 중 · Node.js',
              },
            ],
          },
          // 학력·교육을 한 섹션으로(11-12 사용자 결정). 최신순
          education: {
            eyebrow: 'EDUCATION',
            title: '학력 · 교육',
            items: [
              {
                period: '2027.02 예정',
                title: '학점은행제 컴퓨터공학 학사',
                desc: '학위취득',
              },

              {
                period: '2023.03 ~ 08',
                title: '웹 퍼블리셔 과정',
                desc: '부산IT교육센터',
              },
            ],
          },
          license: {
            eyebrow: 'LICENSE',
            title: '자격증',
            // period = 취득 연월, desc = 발행기관(경력·학력과 같은 "기간 | 이름 + 기관" 줄, 11-12)
            items: [
              { period: '2024.12', title: '네트워크관리사 2급', desc: '한국정보통신자격협회' },
              { period: '2021.10', title: '한국사능력검정시험 2급', desc: '국사편찬위원회' },
              { period: '2018.10', title: '공인중개사', desc: '한국산업인력공단' },
            ],
          },
          other: {
            eyebrow: 'OTHER',
            title: '기타 경력',
            items: [
              {
                period: '2020.02 ~ 2022.01',
                duration: '2년',
                org: '스타공인중개사사무소',
                role: '대표',
              },
              {
                period: '2018.12 ~ 2019.10',
                duration: '11개월',
                org: '효천공인중개사사무소',
                role: '소속공인중개사',
              },
              {
                period: '2013.09 ~ 2018.03',
                duration: '4년 7개월',
                org: '가야홈플러스베이직하우스',
                role: '매니저',
                desc: '매장관리 및 직원관리',
              },
            ],
          },
        },
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
