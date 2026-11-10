// 포트폴리오 창 내용. 화면 코드와 분리해 두었으니 글만 여기서 고치면 됩니다.
// "TODO:"로 시작하는 값은 실제 내용으로 바꿔야 합니다.
window.PORTFOLIO_CONTENT = {
  name: '박찬령',
  role: '프론트엔드 개발자',
  greeting: 'WELCOME TO MY PORTFOLIO!',
  boardIdle: ['2013 → 2026'],
  // 인필드 이정표 3줄
  sign: ['경험은 넓게', '실행은 빠르게', '성장은 꾸준히'],
  // 인트로 전광판: 위 띠(단계) + 문구 4개를 차례로
  boardSteps: ['DISCOVER', 'PLAN', 'BUILD'],
  board: ['문제를 찾고,', '해결 방법을 기획하고,', '실제 결과물로 만드는', '프론트엔드 개발자 박찬령입니다.'],
  // menu 순서 = 화면 메뉴 순서. item = 트랙 월드 구조물 id
  stations: [
    { id: 'about', menu: 'ABOUT ME', item: 'arch', sub: 'START 아치 · 소개',
      sections: [
        { type: 'text', heading: '소개', body: '브랜드매장 매니저와 공인중개사사무소 대표를 거쳐, 2023년부터 프론트엔드 웹 개발자로 일하고 있습니다. 사람을 직접 만나 문제를 듣던 경험을 화면 설계에 그대로 씁니다.' },
        { type: 'text', heading: '이 사이트', body: '방향키(↑ ↓ ← →)로 트랙과 잔디 위를 자유롭게 달립니다. 구조물 앞에서 SPACE를 누르거나 구조물을 클릭하면 창이 열립니다. 위 메뉴나 미니맵으로 바로 갈 수도 있습니다.' }
      ] },
    { id: 'career', menu: 'CAREER', item: 'board', sub: '인필드 전광판 · 경력',
      sections: [
        { type: 'timeline', heading: '경력', items: [
          { period: '2023 ~ 현재', title: '프론트엔드 웹 개발자', desc: 'TODO: 회사·담당 업무 한 줄' },
          { period: '2018 ~ 2022', title: '공인중개사사무소 대표', desc: 'TODO: 한 줄 요약' },
          { period: '2013 ~ 2018', title: '브랜드매장 매니저', desc: 'TODO: 한 줄 요약' }
        ] }
      ] },
    { id: 'p1', menu: 'PROJECT1', item: 'waterA', sub: '급수대 1 · nanaki',
      title: 'nanaki',
      sections: [
        { type: 'stats', items: [
          { label: '1만 건 동기화', value: '3.3→0.93초' },
          { label: '단위 테스트', value: '845/851' },
          { label: 'Lighthouse 모바일', value: '99·95·92' }
        ] },
        { type: 'text', heading: '문제', body: '오프라인에서 쌓인 기록 1만 건을 다시 동기화할 때 메인 스레드가 3초 넘게 멈춰, 앱을 다시 연 사용자가 첫 화면에서 입력을 못 했습니다.' },
        { type: 'list', heading: '기술 고민', numbered: true, items: [
          { tag: '동기화를 워커로', desc: '병합 계산을 Web Worker로 옮기고 500건 단위로 나눠 메인 스레드를 비웠습니다.' },
          { tag: '충돌 규칙', desc: "문서 단위가 아니라 필드 단위로 '마지막 수정 우선'을 적용해 덮어쓰기 사고를 막았습니다." },
          { tag: '목록 가상화', desc: '화면에 보이는 행만 그리게 해 1만 행 첫 렌더 비용을 줄였습니다.' }
        ] },
        { type: 'text', heading: '품질', body: '동기화·병합 로직 단위 테스트 845/851 통과(6건은 외부 API 대기). PR마다 Lighthouse CI로 모바일 점수가 떨어지면 병합을 막습니다.' },
        { type: 'links', items: [ { label: '배포 보기 ↗', href: 'TODO', primary: true }, { label: 'GitHub ↗', href: 'TODO' } ] }
      ] },
    { id: 'p2', menu: 'PROJECT2', item: 'waterB', sub: '급수대 2 · dahda',
      title: 'dahda',
      sections: [
        { type: 'text', heading: '문제', body: 'TODO: dahda가 해결한 문제' },
        { type: 'list', heading: '기술 고민', numbered: true, items: [ { tag: 'TODO', desc: 'TODO: 결정과 이유' } ] },
        { type: 'links', items: [ { label: '배포 보기 ↗', href: 'TODO', primary: true }, { label: 'GitHub ↗', href: 'TODO' } ] }
      ] },
    { id: 'skill', menu: 'SKILL', item: 'tent', sub: '관중석 천막 · 기술',
      sections: [
        { type: 'list', heading: '실무', items: [
          { tag: 'React', desc: '함수 컴포넌트와 훅으로 화면 단위 상태를 나눠 설계' },
          { tag: 'TypeScript', desc: 'API 응답 타입을 먼저 정의해 화면 버그를 컴파일 단계에서 차단' },
          { tag: 'Next.js', desc: 'SSR·정적 생성으로 첫 화면 속도와 검색 노출 확보' },
          { tag: 'React Query', desc: '서버 상태 캐시·재시도·낙관적 업데이트' },
          { tag: 'Storybook', desc: '컴포넌트를 상태별로 문서화해 디자이너와 함께 검수' },
          { tag: 'Lighthouse CI', desc: 'PR마다 성능 점수를 기록하고 기준 미달 시 병합 차단' }
        ] },
        { type: 'list', heading: '프로젝트', items: [
          { tag: 'Web Worker', desc: '무거운 동기화 계산을 메인 스레드 밖으로' },
          { tag: 'IndexedDB', desc: '오프라인 기록 저장과 재연결 시 병합' },
          { tag: 'Vitest', desc: '병합 규칙 845개 단위 테스트' },
          { tag: 'Design Tokens', desc: 'color·space·radius 토큰으로 화면 값 통일' }
        ] }
      ] },
    { id: 'resume', menu: 'RESUME', item: 'table', sub: '접수 테이블 · 이력서 · 연락',
      sections: [
        { type: 'text', heading: '이력서', body: '최신 이력서를 PDF로 받을 수 있습니다.' },
        { type: 'links', items: [ { label: '이력서 PDF ↓', href: 'TODO', primary: true }, { label: '이메일 보내기', href: 'mailto:TODO' }, { label: 'GitHub ↗', href: 'TODO' } ] }
      ] }
  ]
};
