/**
 * 창별 조회 집계(11-18 사용자 요청): 창이 열리면 그 창 이름의 "가상 페이지 조회"를 한 번 보낸다.
 *
 * 왜 필요한가: 이 사이트는 주소가 `/` 하나다. 방문 집계(Vercel Web Analytics, app/layout.tsx)는 주소 단위로 세므로
 *   어떤 창을 열어 봤는지가 전혀 남지 않는다. 창마다 `/career` 같은 경로로 조회를 보내면 Pages 목록에 나뉘어 보인다.
 *   실제 주소는 바뀌지 않는다(history를 건드리지 않음): 뒤로 가기·새로 고침 동작이 그대로다.
 * 왜 방문당 창마다 한 번만: 같은 창을 세 번 열어도 "그 창을 봤다"는 사실은 하나다. 열 때마다 보내면 Page Views가 부풀어
 *   "몇 번 방문했나"로 읽을 수 없게 된다.
 * 왜 window.va를 직접 부르나: 집계 스크립트가 만드는 정해진 창구다(패키지의 pageview()도 안에서 이것을 부른다).
 *   패키지를 넣으면 첫 화면 JS가 는다(performance.md 0-4). 이 파일은 창 조각(처음 열 때 받음)에 실려 첫 화면 비용이 없다.
 * va가 없으면(로컬·CI, 광고 차단) 아무것도 하지 않는다. 집계는 사이트 동작에 영향을 주면 안 된다.
 * 경로는 메뉴 id가 아니라 읽기 쉬운 이름: 대시보드에서 project2보다 /dev-log가 바로 읽힌다.
 */
import type { LandmarkId } from '@/features/track/layout';

declare global {
  interface Window {
    /** Vercel Web Analytics 창구(app/layout.tsx가 Vercel 배포에서만 만든다) */
    va?: (event: 'pageview', props: { path: string }) => void;
  }
}

export const PANEL_PATH: Record<LandmarkId, string> = {
  about: '/about-me',
  career: '/career',
  project1: '/project',
  project2: '/dev-log',
  skill: '/skills',
  resume: '/resume',
};

/**
 * 창 조회 기록기. send를 받아 만든다(테스트에서 가짜를 넣기 위해).
 * @returns 창 id를 넘기면, 이번 방문에서 처음 열린 창일 때만 send(경로)를 부르는 함수
 */
export function createPanelViewTracker(send: (path: string) => boolean) {
  const seen = new Set<LandmarkId>();
  return (id: LandmarkId) => {
    if (seen.has(id)) return;
    // 보내지 못했으면(va 없음) 기억하지 않는다: 집계 스크립트가 늦게 와도 다음에 열 때 보낼 수 있다
    if (send(PANEL_PATH[id])) seen.add(id);
  };
}

/** 실제 전송: va가 있으면 보내고 true */
const sendToVercel = (path: string): boolean => {
  if (typeof window === 'undefined' || typeof window.va !== 'function') return false;
  window.va('pageview', { path });
  return true;
};

export const trackPanelView = createPanelViewTracker(sendToVercel);
