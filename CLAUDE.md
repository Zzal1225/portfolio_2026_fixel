# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 따르는 규칙이다.
이 프로젝트는 **픽셀 게임(육상 트랙) 컨셉의 포트폴리오 사이트**다. nanaki·dahda와 같은 방식으로 Claude가 구현하고 사용자는 "왜" 주석과
`private/learning/`으로 공부하되, **핵심 파일 2개는 사용자가 직접 짠다**(5-1 참고). 상세 기획은 `docs/기획서.md`를 따른다.

---

## 1. 목적

- **무엇을**: 화면보다 큰 400m 트랙 월드(탑뷰, 내부 640×360) 위를 캐릭터가 달리고 카메라가 따라가는 포트폴리오 사이트. 트랙 위 구조물 6개
  (START · FINISH 아치, 전광판, 급수대 2, 천막, 접수 테이블) 앞에 서거나 메뉴 아이콘·미니맵을 누르면
  ABOUT · CAREER · PROJECT 1 · PROJECT 2 · EDUCATION · RESUME 창이 열린다. 첫 방문에는 출발 신호등 + 2× 줌아웃 한 바퀴(전광판에 DISCOVER → PLAN → BUILD 띠 + 자기소개 문구 4개) + 정수 줌인 + 인사 인트로(약 7초, 인사부터 조작 가능). 끝나면 ▶ REPLAY 버튼.
  일반 모드 페이지·효과음은 없다(11-09 결정). 메뉴명은 영어 고정.
- **왜**: 담당자 기억에 남는 첫인상 + 본인 이야기(러닝·경력 코스). 주제어는 "기록". 정보 도달은 메뉴 한 번 클릭으로 끝나야 한다.
- **포트폴리오로 증명할 것**: 게임 엔진 없이 React·CSS로 트랙 위 이동·카메라·최단 방향·스프라이트 애니메이션을 직접 구현하면서
  접근성(키보드·스크린리더·reduced-motion)과 성능(Lighthouse 90+, 정수 배율 픽셀 렌더링, 카메라 이동 중 레이아웃 재계산 0)을 지킨 것.
- **핵심 원칙**: 글과 버튼은 전부 DOM(캔버스에 글 그리지 않음). 인트로는 건너뛸 수 있고 첫 방문만. 가짜 대기 금지.
  조작 4가지(키보드·터치·메뉴·미니맵/MAP 창)는 항상 같은 결과. 순서 강제 없음. 키보드는 ↑↓←→·WASD를 다 받되 캐릭터는 트랙 위 두 방향으로만 움직인다(B안). 러닝 요소는 트랙·아치·번호표까지, 창 내용은 개발 이야기만.
  참고한 사이트의 그림·맵·문구를 쓰지 않는다. 실제 브랜드 로고를 그리지 않는다.
- **범위**: step1~3은 기획서 "기능 범위" 표. 트랙 밖 장면·NPC·다크 모드·4방향 패드·가로 강제·랩타임은 범위 밖. 미구현 구조물은 월드에 두지 않는다.
  구조물은 6개, 메뉴도 6개. 구조물 이름은 구조물 그림의 빈 면 위 HTML 오버레이(그림에 글자 없음, 제목 판 없음). 그 밖에 인필드 장식 이정표 1개(창 없음, 판 위 HTML 글자 3줄, 11-10 결정).
- **화면**: 월드 640×360, 정수 배율(모바일 2×·태블릿 3×·PC 4×), 카메라 추적. 세로 전용 배치 없음. 라이트만. 창 본문 한국어, 라벨 영어.

## 2. 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | Next.js (App Router) + TypeScript (strict) |
| 게임 렌더링 | DOM + CSS. 월드 컨테이너 하나를 `transform: translate3d`로 움직여 카메라. 스프라이트 시트 `background-position` + `animation-timing-function: steps()` |
| 게임 상태 | Zustand (`features/track/store.ts`: `t`(0~1)·방향·running·목표 지점·카메라 좌표·열린 창·인트로 상태) |
| 트랙 경로 | `features/track/trackPath.ts` (사용자 작성): `t` → 월드 픽셀 좌표·바라보는 방향, 두 `t` 사이 최단 방향·거리 |
| 이동·카메라 | `features/track/useRunner.ts` (사용자 작성): 입력 → 상태 머신(idle → running → arrived), 카메라 목표 계산(여유 구간·월드 경계) |
| 미니맵·MAP 창 | 인라인 SVG (`features/hud/Minimap.tsx`): 타원 path + 구조물 점 `<button>` 6개 + 현재 화면 rect. PC는 오른쪽 아래 160×90, 모바일은 "MAP" 버튼 → 같은 SVG를 Dialog 안에 크게(`features/hud/MapDialog.tsx`) |
| 창 | Radix Dialog + Framer Motion |
| 스타일 | Tailwind + 디자인 토큰(nanaki 토큰 JSON 규칙, 라이트 값만) |
| 폰트 | Press Start 2P(OFL) 영어 라벨·HUD·창 제목, Galmuri(OFL) 한국어 픽셀 글자(전광판 문구·이정표·창 섹션 제목), Pretendard 본문. 전부 `next/font/local` self-host |
| 테스트 | Vitest, Testing Library, Playwright(+axe, 화면 비교 PC 1280·모바일 390) |
| CI/CD | GitHub Actions, Lighthouse CI(첫 화면), Vercel |

- 위 목록에 없는 라이브러리는 먼저 **이유와 대안**을 제시하고 승인을 받는다. Phaser·PixiJS·react-three 등 렌더링 엔진은 금지.
- `<canvas>`는 step2에서 달리기·카메라 이동 중 프레임 저하가 측정으로 확인될 때만, 월드 배경(트랙·잔디·관중석·소품) 한 장에 한해 검토한다. 글·버튼·캐릭터·구조물은 DOM 유지.
- **Design 결과물(`design/` 폴더의 .dc.html 5개와 내려받은 PNG)은 배치·크기·타이밍·그림의 기준이다.** Portfolio Game.dc.html 프로토타입은 캔버스 두 장·자유 4방향 이동·로고 HUD로 만들어져 있으므로 **그 코드와 구조를 옮기지 않는다**. 동작을 참고할 때는 "무엇이 언제 보이는가"만 가져오고, 구현은 이 문서대로 DOM+CSS·트랙 위 이동으로 한다. Design 파일과 기획서가 다르면 기획서가 우선이고, 다른 점을 발견하면 먼저 보고한다.
- 스프라이트는 `public/sprites/*.png` 시트. 시트당 16색 이내. 러너 시트는 128×240(행 순서: 아래·위·오른쪽·왼쪽 각 4프레임, 5행째 손 흔들기 2프레임, 칸 32×48). 팔레트는 Design 최종 16색(피부 그림자 #E3A68A 포함)을 `styles/globals.css` 토큰으로. 월드 배경은 32×32 타일을 CSS `background-repeat`로 깐다(큰 PNG 한 장 금지). 그림 파일을 바꿀 때 `docs/assets/credits.md`(출처·라이선스)를 함께 갱신한다.
- 화면 배율은 CSS 변수 `--scale`(정수)로만 바꾼다. 소수 배율·`zoom` 금지. 배율은 `clamp(floor(min(w/320, h/180)), 2, 4)`(항상 월드 320×180 이상이 보임). **예외는 인트로 한 바퀴뿐**: 평소 배율의 절반(PC·태블릿 2×, 모바일 1×)으로 월드 전체를 보여 주고, 끝나면 캐릭터를 중심으로 `--scale`을 2 → 3 → 4로 **정수 단계 두 번**(각 0.2초) 올려 평소 배율에 돌아온다. 소수 배율은 어느 순간에도 쓰지 않는다.
- 인트로 흐름은 `신호등(1.5s) → 줌아웃 한 바퀴(5s, 전광판 위 띠 "DISCOVER → PLAN → BUILD" + 문구가 t 0.05/0.3/0.55/0.8에서 "문제를 찾고," → "해결 방법을 기획하고," → "실제 결과물로 만드는" → "프론트엔드 개발자 박찬령입니다.", 문구 1·2·3일 때 해당 단어만 강조·문구 4에서 셋 다 강조, 진행 점 4개) → 정수 줌인(0.4s, HUD·미니맵 등장) → 인사(2.5s, 정면 손 흔들기 + 말풍선 "WELCOME TO MY PORTFOLIO!", 이때부터 입력 허용) → 키캡 안내(첫 입력까지)`. 끝나면 왼쪽 아래 `▶ REPLAY`(처음부터 재생, 열린 창 닫음). 재방문은 평소 배율에서 `짧은 인사(1.5s) → 키캡 안내`만. 전광판이 화면 밖(모바일 세로 1×)이면 같은 글자를 화면 위쪽 띠로 보여 준다.
- 카메라는 월드 컨테이너의 `transform`만 바꾼다. `left/top`·`scroll` 사용 금지(레이아웃 재계산 0이 측정 목표).
- 인트로 프리로드는 `<link rel="preload">` + `document.fonts.ready` + 이미지 `decode()`로 실제 완료를 기다린다. `setTimeout`으로 꾸민 대기 금지.
- 첫 방문 여부는 `localStorage.introSeen`. 읽기·쓰기는 try/catch, 실패하면 "본 것"으로 취급해 바로 트랙으로.
- `prefers-reduced-motion: reduce`면 신호등·한 바퀴·줌·손 흔들기 생략, 인사 말풍선은 고정 표시, 이동·카메라는 즉시 이동(transition 없음), 창 애니메이션 끔.
- 소리는 없다. 오디오 파일·오디오 API를 넣지 않는다.

## 3. 코드맵

> 실제 구조가 생기면 채운다. `(예정)`은 아직 없는 폴더.

```
src/
  app/
    page.tsx             게임 모드(인트로 → 트랙 월드)
    layout.tsx           폰트·메타·OG
  features/
    intro/               IntroScene(신호등·줌아웃 한 바퀴·흑백→컬러·줌인), Greeting(손 흔들기 + 말풍선), KeyHint(키캡 ← → / 모바일 ◀ ▶ 깜빡임),
                         useIntroGate(첫 방문·reduced-motion), preload.ts
    track/               World(카메라 컨테이너), TrackScene, Runner(캐릭터), Landmark(구조물 6 + 제목 판 HTML), Scoreboard(전광판 HTML 글자: 평소 "CAREER", 인트로 단계 띠 + 문구 4개), Signpost(장식 이정표 + HTML 글자 3줄), Props(소품, aria-hidden),
                         store.ts, trackPath.ts(사용자 작성), useRunner.ts(사용자 작성), layout.ts(월드 배치·구조물 t·소품 좌표)
    panels/              창 내용 컴포넌트(About[PROFILE|SKILLS 탭], Career, Project1, Project2, Education, Resume)
    hud/                 번호표 이름 띠, 메뉴 아이콘 6개(PC 상단/모바일 하단), ◀ ▶ 버튼, Minimap(PC), MapDialog(모바일 MAP 창), ReplayButton (조작 안내는 intro/KeyHint)
  content/               글 데이터(TS 객체). 문구는 여기에만
  components/ui/         Dialog 래퍼(픽셀 테두리), 버튼, 토큰
  styles/                globals.css(토큰), sprites.css(시트 좌표·애니메이션)
public/
  sprites/               tiles.png, landmarks.png, props.png, runner.png, ui.png
  resume.pdf             이력서(원본은 별도 보관)
docs/                    기획서.md, performance.md, milestones.md, assets/credits.md, troubleshooting/
private/                 learning/, interview-questions.md (gitignore)
```

## 4. 규칙

### 네이밍
- 파일·폴더 kebab-case, 컴포넌트 PascalCase, 훅 `use*`.
- 트랙 위치는 `t`(0 이상 1 미만, 출발선 = 0, 시계 반대 방향으로 증가). 월드 픽셀 좌표는 `{ x, y }`(배율 적용 전). 변환은 `trackPath.ts`의 `toWorld(t)` 한 곳. 화면 좌표는 카메라 컨테이너가 맡으므로 컴포넌트에서 직접 계산하지 않는다.
- 진행 방향은 `'ccw' | 'cw'`. 바라보는 방향(스프라이트)은 `'left' | 'right' | 'up' | 'down'`으로 `trackPath`가 계산.
- 키 입력은 `{ dx: -1|0|1, dy: -1|0|1 }`(↑↓←→·WASD 합산)로 받고, `trackPath.keyToDirection(t, dx, dy)`가 현재 지점의 접선과 내적해 `'ccw' | 'cw' | null`을 돌려준다(수직이면 null = 멈춤). 캐릭터는 어떤 입력에도 트랙을 벗어나지 않는다(B안, 11-09).
- 메뉴·구조물 id는 `'about' | 'career' | 'project1' | 'project2' | 'education' | 'resume'`. 화면 라벨은 `content/menu.ts`의 영어 문자열. 인트로 전광판 글은 `content/intro.ts`의 `boardSteps`·`boardLines`(t·문구), 이정표 3줄은 `content/intro.ts`의 `signLines`.

### 게임 상태와 렌더
- 이동은 고정 틱(예: 60ms)마다 `t`를 갱신하고 CSS transition이 보간한다. 카메라 목표도 같은 틱에서 계산한다. `requestAnimationFrame` 루프 금지.
- 카메라: 캐릭터가 화면 가운데 여유 구간(가로·세로 각 40%) 안에 있으면 움직이지 않고, 벗어나면 따라간다. 월드 경계에서 멈춘다. 메뉴 자동 이동 중에는 캐릭터를 가운데에 둔다.
- 배치 데이터(`layout.ts`)는 트랙 경로 꼭짓점, 구조물 6개의 `t`·반응 구역 반경·스프라이트 위치, 장식 이정표 위치, 소품 좌표를 함께 정의한다(전광판 문구가 바뀌는 t는 문구와 함께 `content/intro.ts`). 반응 판정은 배치 데이터만 보고 한다.
- 메뉴·미니맵·탭으로 가는 자동 이동은 `trackPath.shortestDirection(from, to)`로 방향을 정하고 2배 속도. 도착 시 창을 바로 연다. 키보드·버튼으로 달려 도착하면 `!`만 띄우고 Enter·Space·탭을 기다린다.
- 자기소개 문구는 인트로 한 바퀴에서만 전광판에 찍힌다(레인 옆 말풍선 없음). 평소 전광판은 "CAREER". 인사 말풍선·키캡 안내는 입력이 들어오면 즉시 사라지고 다시 나오지 않는다.
- 소품은 `Props`에서만 그리고 상태를 갖지 않는다. 구조물 반경 2칸 안에는 두지 않는다(`layout.ts`에서 검사하는 단위 테스트).
- 창이 열려 있으면 달리기 입력을 무시한다. Tab 키는 게임이 가로채지 않는다.

### 접근성
- 구조물·메뉴 아이콘·미니맵 점은 `<button>`에 `aria-label`("Open CAREER"). 캐릭터·타일·소품은 `aria-hidden`.
- 키보드 사용자는 메뉴 아이콘으로 창을 연다. 방향키 달리기는 월드에 포커스가 있을 때만 동작하고, 창·MAP 창이 열려 있으면 ←→는 이전·다음 구조물로 넘긴다.
- 창은 Radix Dialog 기본(포커스 트랩·ESC·`aria-labelledby`). 창 안 제목은 `h2`. 이전·다음 구조물 버튼 포함. ABOUT 창의 PROFILE|SKILLS 탭은 Radix Tabs.
- 색만으로 뜻을 전하지 않는다(신호등은 색 + 글자 "SET"/"GO", `!` 말풍선은 아이콘 + 시각적 숨김 텍스트).

### 성능
- 이미지는 스프라이트 시트, 인트로에서 프리로드. 첫 화면 JS 150KB(gzip) 이하 목표.
- 카메라·캐릭터 이동은 `transform`만. 이동 중 Layout/Recalc Style 0회가 측정 기준.
- 성능 작업은 **변경 전 수치를 먼저 측정**하고 전후를 `docs/performance.md`에 측정 조건과 함께 기록.

### 코드 스타일
- ESLint + Prettier, `strict`, `noUncheckedIndexedAccess`. `any` 금지.
- 글(문구)은 `content/`에만. 컴포넌트에 한국어·영어 문장을 하드코딩하지 않는다.

## 5. 워크플로우

### 5-1. 구현 방식 (기본값, 가장 중요)
Claude가 기능을 직접 구현한다. 단, 아래 2개 파일은 **사용자가 직접 작성**한다. Claude는 설계 설명, 입력·출력 정의, 힌트, 코드 리뷰, 테스트 작성만 한다.
사용자가 요청하지 않는 한 이 파일의 본문을 써 주지 않는다.
1. `features/track/trackPath.ts` — 배치 데이터와 `t`를 받아 월드 좌표·바라보는 방향을 돌려주고, 두 `t` 사이 최단 방향과 거리를 계산
2. `features/track/useRunner.ts` — 키보드·◀ ▶·탭·메뉴·미니맵 입력을 받아 틱마다 `t`를 갱신하는 상태 머신(idle → running → arrived), 반응 구역 진입·이탈 판정, 카메라 목표 계산

나머지 절차는 nanaki·dahda와 같다.
1. **시작 전 합의**: 입력·출력·파일 위치를 3~5줄로 정리하고, 사용자가 정해야 하는 결정만 추천안과 함께 묻는다.
2. **구현**: 한 번에 한 기능. 로직은 테스트를 먼저 또는 함께.
3. **주석**: 모든 파일에 "왜" 주석(설계 이유, 버린 대안, 함정). 코드를 다시 말하는 주석 금지.
4. **학습 노트**: `private/learning/00-roadmap.md` + 기능마다 `NN-기능명.md`(무엇을·왜, 데이터 흐름, 핵심 개념, 함정, 면접 질문, 직접 해 볼 것).
5. **마무리 응답**: 만든 것, 확인한 것(테스트·빌드), 확인 못 한 것, 학습 노트 파일.

### 5-2. 작업 절차
1. 관련 파일·이 문서·기획서 범위 확인. 범위 밖이면 먼저 알린다.
2. 구현 → 3. 테스트(경로 변환·최단 방향·반응 구역·카메라 경계·상태 머신·인트로 조건·배율 계산·소품 거리는 단위 테스트 필수) → 4. `lint`, `typecheck`, `test` 통과 후 커밋.
5. 그림 파일을 추가·교체하면 `docs/assets/credits.md` 갱신, 시트 좌표는 `sprites.css`에만.
6. step이 끝날 때마다 Vercel 배포 주소에서 E2E·Lighthouse를 돌리고 `docs/milestones.md`에 기록.

### 5-3. 포트폴리오 기록
- 트러블슈팅: 30분 이상 막혔거나 원인이 예상과 달랐으면 `private/troubleshooting/`에 문제 → 원인 → 해결 → 결과. 막바지에 골라 `docs/troubleshooting/`으로.
- 측정(기획서 "측정 수치"): 초기 JS·LCP·Lighthouse, 인트로 프리로드 완료 비율, 달리기·카메라 중 프레임과 레이아웃 재계산 횟수를 전/후·조건·스크립트 경로와 함께 `docs/performance.md`에.
- README 맨 위에 15초 GIF(신호등 → 한 바퀴 → 메뉴 클릭 → 창). 하단에 그림 출처 한 줄.

### 5-4. 면접 예상 질문
- 작업 중 나온 설계 결정·트레이드오프·트러블슈팅은 `private/interview-questions.md`에 `## YYYY-MM-DD 작업명` / `Q:` / `답 핵심:` / `근거:` 형식으로 추가.
- 기획서 "면접 예상 질문" 목록의 답을 실제로 한 것 기준으로 채운다. 답은 초안이고 사용자가 자기 말로 고친다.
- `private/`는 gitignore. 커밋·PR·README에 넣지 않는다.

## 6. 모듈별 규칙

> 모듈이 구체화된 후 작성한다.

<!-- 예상 모듈: intro(gate, preload, lights, lap), track(world/camera, store, layout, trackPath, runner, landmarks, props), panels(6), hud(menu, minimap) -->
