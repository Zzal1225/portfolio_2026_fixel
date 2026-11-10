# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 따르는 규칙이다.
이 프로젝트는 **픽셀 게임(육상 트랙) 컨셉의 포트폴리오 사이트**다. nanaki·dahda와 같은 방식으로 Claude가 구현하고 사용자는 "왜" 주석과
`private/learning/`으로 공부한다(11-10: 사용자 직접 작성 규칙 폐지, 전부 Claude가 구현). 상세 기획은 `docs/기획서.md`를 따른다.

---

## 0. 11-10 "모두 시안대로" 결정 (아래 본문과 다르면 이것이 우선)

사용자가 시안과 다른 10개 항목을 모두 시안대로 정했다. 기록: `docs/design-vs-plan.md` 7장.

| 항목 | 결정 |
|---|---|
| 이동 | 잔디·인필드 어디든 8방향 자유 이동 + 충돌(`movement.ts`). 트랙 위 두 방향(B안) 폐지 |
| 왼쪽 위 HUD | 로고 "ChanRyeong / PORTFOLIO"(번호표 이름 띠 폐지) |
| 메뉴명 | ABOUT ME · CAREER · PROJECT1 · PROJECT2 · SKILL · RESUME. EDUCATION 창 없음(내용은 ABOUT ME로), ABOUT 탭 없음 |
| 하단 안내 판(PC) | "↑ ↓ ← → 이동 · SPACE 또는 클릭으로 선택" |
| 키캡 | ↑ ← → ↓ 4개가 0.45초마다 차례로 |
| SPACE 태그 | 반응 구역에서 러너 오른쪽(PC) |
| 미니맵(PC) | 버튼 하나 → 큰 지도 창(모바일 MAP과 같은 창) |
| 모바일 ◀ ▶ | 트랙 순서 이전·다음 지점으로 자동 이동 후 창 열기 |
| 인트로 | 시안 14.3초 타임라인, 월드 전체 배율(소수) → 줌인 → 줌아웃 |
| 큰 전광판 | 제자리에서 커지기 + 네온 깜빡임 |
| 재방문 | 인사 없이 바로 인트로 끝 상태(키캡 안내)(11-10 2차 결정) |
| 창 모양 | (11-10 4차) 딤 배경이 스크롤되고 창은 내용 길이만큼 늘어남. 닫기 ✕는 창 밖 화면 오른쪽 위(빨강). 제목 띠·아래쪽 이전·다음 띠는 하늘색(tee) 바탕. 지도 창도 같은 모양 |
| 창 제목 | 프로젝트 창은 "이름(부제목)": nanaki(기록 PWA), dahda(문자 발송 콘솔). 부제목은 `content/panels.ts` subtitle |

사용자가 "지금 유지"로 정한 것(11-10 2차): 카메라 여유 구간 40%, 자동 이동 2배(시안 1.6배), PROJECT 1·2 급수대 배치(11-09 D1), 평소 배율 상한 4.

## 1. 목적

- **무엇을**: 화면보다 큰 400m 트랙 월드(탑뷰, 내부 640×360) 위를 캐릭터가 달리고 카메라가 따라가는 포트폴리오 사이트. 트랙 위 구조물 6개
  (START · FINISH 아치, 전광판, 급수대 2, 천막, 접수 테이블) 앞에 서거나 메뉴 아이콘·미니맵을 누르면
  ABOUT ME · CAREER · PROJECT1 · PROJECT2 · SKILL · RESUME 창이 열린다. 첫 방문에는 시안 인트로(약 14.3초): 출발 신호등 → 월드 전체 배율로 한 바퀴(전광판이 화면 가운데로 커져 DISCOVER → PLAN → BUILD 띠 + 자기소개 문구 4개) → 러너로 줌인 → 인사 → 줌아웃. 끝나면 ▶ REPLAY 버튼.
  일반 모드 페이지·효과음은 없다(11-09 결정). 메뉴명은 영어 고정.
- **왜**: 담당자 기억에 남는 첫인상 + 본인 이야기(러닝·경력 코스). 주제어는 "기록". 정보 도달은 메뉴 한 번 클릭으로 끝나야 한다.
- **포트폴리오로 증명할 것**: 게임 엔진 없이 React·CSS로 트랙 위 이동·카메라·최단 방향·스프라이트 애니메이션을 직접 구현하면서
  접근성(키보드·스크린리더·reduced-motion)과 성능(Lighthouse 90+, 정수 배율 픽셀 렌더링, 카메라 이동 중 레이아웃 재계산 0)을 지킨 것.
- **핵심 원칙**: 글과 버튼은 전부 DOM(캔버스에 글 그리지 않음). 인트로는 건너뛸 수 있고 첫 방문만. 가짜 대기 금지.
  조작 4가지(키보드·터치·메뉴·지도 창)는 항상 같은 결과. 순서 강제 없음. 키보드는 ↑↓←→·WASD로 **잔디·인필드 어디든 8방향 자유 이동**(11-10 시안 채택, B안 폐지). 러닝 요소는 트랙·아치·번호표까지, 창 내용은 개발 이야기만.
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
| 트랙 경로 | `features/track/trackPath.ts`: `t` → 월드 픽셀 좌표·바라보는 방향, 두 `t` 사이 최단 방향·거리 |
| 이동·카메라 | `features/track/useRunner.ts`: 입력 → 상태 머신(idle → running → arrived), 카메라 목표 계산(여유 구간·월드 경계) |
| 미니맵·MAP 창 | 인라인 SVG (`features/hud/Minimap.tsx`): 타원 path + 구조물 점 `<button>` 6개 + 현재 화면 rect. PC는 오른쪽 아래 160×90, 모바일은 "MAP" 버튼 → 같은 SVG를 Dialog 안에 크게(`features/hud/MapDialog.tsx`) |
| 창 | Radix Dialog + CSS 애니메이션(data-state). Framer Motion은 쓰지 않음(첫 화면 JS 예산, 11-10) |
| 스타일 | Tailwind + 디자인 토큰(nanaki 토큰 JSON 규칙, 라이트 값만) |
| 폰트 | Press Start 2P(OFL) 영어 라벨·HUD·창 제목, Galmuri(OFL) 한국어 픽셀 글자(전광판 문구·이정표·창 섹션 제목), Pretendard 본문. 전부 `next/font/local` self-host |
| 테스트 | Vitest, Testing Library, Playwright(+axe, 화면 비교 PC 1280·모바일 390) |
| CI/CD | GitHub Actions, Lighthouse CI(첫 화면), Vercel |

- 위 목록에 없는 라이브러리는 먼저 **이유와 대안**을 제시하고 승인을 받는다. Phaser·PixiJS·react-three 등 렌더링 엔진은 금지.
- `<canvas>`는 step2에서 달리기·카메라 이동 중 프레임 저하가 측정으로 확인될 때만, 월드 배경(트랙·잔디·관중석·소품) 한 장에 한해 검토한다. 글·버튼·캐릭터·구조물은 DOM 유지.
- **Design 결과물(`design/` 폴더의 .dc.html 5개와 내려받은 PNG)은 배치·크기·타이밍·그림의 기준이다.** Portfolio Game.dc.html 프로토타입은 캔버스 두 장·자유 4방향 이동·로고 HUD로 만들어져 있으므로 **그 코드와 구조를 옮기지 않는다**. 동작을 참고할 때는 "무엇이 언제 보이는가"만 가져오고, 구현은 이 문서대로 DOM+CSS·트랙 위 이동으로 한다. **Design 결과물과 기획서·CLAUDE.md가 다르면 어느 한쪽을 자동으로 따르지 않는다. 다른 점을 보고하고 사용자에게 물어 결정한다**(11-10 규칙 변경). 결정은 기획서와 `docs/design-vs-plan.md`에 기록한다. 시안에만 있고 기획서와 충돌하지 않는 것(그림·연출 디테일)은 시안대로 만든다.
- 스프라이트는 `public/sprites/*.png` 시트. 작은 그림(구조물·이정표·신호등·심판·선택 외곽선·! ·키캡)은 `scripts/build-sheets.mjs`가 시트 3장(`public/sprites/sheets/`)으로 합치고 좌표를 sprites.css 생성 블록에 CSS 변수로 쓴다. 시트당 16색 이내. 러너 시트는 128×240(행 순서: 아래·위·오른쪽·왼쪽 각 4프레임, 5행째 손 흔들기 2프레임, 칸 32×48). 팔레트는 Design 최종 16색(피부 그림자 #E3A68A 포함)을 `styles/globals.css` 토큰으로. 월드 배경은 32×32 타일을 CSS `background-repeat`로 깐다(큰 PNG 한 장 금지). 예외는 곡선 레인 띠 하나: `scripts/build-track-ring.mjs`가 굽는 투명 PNG(512×232, 약 3KB, 11-10 결정). 그림 파일을 바꿀 때 `docs/assets/credits.md`(출처·라이선스)를 함께 갱신한다.
- 평소 플레이 배율은 CSS 변수 `--scale`(정수)로만 바꾼다. 배율은 `clamp(floor(min(w/320, h/180)), 2, 4)`. **예외는 인트로뿐(11-10 시안 채택)**: 한 바퀴 동안 월드 전체가 들어오는 배율 min(w/640, h/360)(소수 가능), 끝에 러너로 줌인(PC 평소+2, 모바일 3), 인사 뒤 평소 배율로 줌아웃. 이 구간은 소수 배율을 허용한다. `zoom` 속성은 금지.
- 인트로 흐름(시안 타임라인, `features/intro/timeline.ts`)은 `0–0.6 빨강 ON YOUR MARKS → 0.6–1.2 노랑 SET → 1.2–1.8 초록 GO → 1.8–10.0 한 바퀴 + 80px(흑백 → 컬러 부채꼴, 큰 전광판 1.8–2.2 커짐 · 2.2–9.4 문구 4개 1.8초씩 네온 깜빡임 · 9.4–10.0 제자리로) → 10.0–10.8 줌인 → 10.8–13.6 손 흔들기 + "WELCOME TO MY PORTFOLIO!" → 13.6–14.3 줌아웃·HUD 등장 → 키캡 ↑←→↓ 4개(첫 입력까지)`. SKIP·아무 키는 인트로 끝 상태로 바로. 끝나면 왼쪽 아래 `▶ REPLAY`. 재방문은 인사 없이 바로 끝 상태(키캡 안내)(시안).
- 카메라는 월드 컨테이너의 `transform`만 바꾼다. `left/top`·`scroll` 사용 금지(레이아웃 재계산 0이 측정 목표).
- 인트로 프리로드는 `<link rel="preload">` + `document.fonts.ready` + 이미지 `decode()`로 실제 완료를 기다린다. `setTimeout`으로 꾸민 대기 금지.
- 첫 방문 여부는 `localStorage.introSeen`. 읽기·쓰기는 try/catch, 실패하면 "본 것"으로 취급해 바로 트랙으로.
- `prefers-reduced-motion: reduce`면 신호등·한 바퀴·줌·손 흔들기 생략, 인사 말풍선은 고정 표시, 이동·카메라는 즉시 이동(transition 없음), 창 애니메이션 끔.
- 소리는 없다. 오디오 파일·오디오 API를 넣지 않는다.

## 3. 코드맵

> 11-10 실제 구조 기준. `(예정)`은 아직 없는 것.

```
src/
  app/
    page.tsx             서버 컴포넌트. 숨은 h1 + <Game/>
    layout.tsx           폰트 3종(next/font/local, fonts/ + licenses/)·메타
  features/
    track/               Game.tsx(최상위: useScale·useIntro·useRunner를 한 번씩 부르고 goTo를 메뉴·지도·구조물에 나눔, 창 지연 로딩)
                         World.tsx(카메라 = 컨테이너 transform 하나), TrackScene.tsx(타일 + 트랙 고리 PNG), Runner.tsx(러너·`!`),
                         Landmark.tsx(구조물 6 버튼 + HTML 이름, 전광판 평소 "CAREER"), Decor.tsx(소품·이정표, aria-hidden),
                         layout.ts(배치 데이터만), trackPath.ts(t ↔ 좌표·방향, nearestS), movement.ts(자유 이동·충돌·반응 구역·자동 경로), useRunner.ts(stepRunner·cameraTarget + 틱 훅),
                         store.ts(Zustand), runner-config.ts(틱·속도), scale.ts·useScale.ts(정수 배율)
    intro/               timeline.ts(경과 ms → 화면, 순수), useIntro.ts(고정 틱 진행기·SKIP·REPLAY·introSeen), camera.ts(인트로 카메라·부채꼴 각도),
                         storage.ts(introSeen try/catch), preload.ts(fonts.ready·decode), IntroOverlay.tsx(신호 띠·SKIP·큰 전광판·진행 점·흑백 부채꼴),
                         WorldIntro.tsx(신호등·심판·인사 말풍선·키캡)
    panels/              PanelDialog.tsx(Radix Dialog 하나에 6개 내용, 이전·다음, ABOUT 탭), Sections.tsx(섹션 타입 렌더러)
    hud/                 Hud.tsx(로고·메뉴 PC 상단/모바일 하단 3×2·하단 안내 판·REPLAY), Minimap.tsx(TrackMap: 시안 월드 그림 + 구조물 버튼, PC 미니맵 버튼·모바일 MAP 버튼),
                         MapDialog.tsx(큰 지도 창, PC·모바일 공통), TouchControls.tsx(모바일 ◀ ▶ = 이전·다음 지점)
  content/               intro.ts, menu.ts, hud.ts, panels.ts, world.ts — 문구는 여기에만
  styles/                globals.css(16색 토큰·9-slice·창 애니메이션), sprites.css(그림 경로·시트 좌표·스프라이트 애니메이션)
public/
  sprites/               tiles/ structures/ props/ ui/ character/ intro/ world/(track-ring) — Design 개별 PNG(시트 합치기는 step3 검토)
  resume.pdf             (예정) 이력서
scripts/                 extract-design-layout.mjs·build-track-ring.mjs(시안 코드에서 숫자·그림 1회 추출), lh-summary.mjs, measure-run.mjs(측정)
e2e/                     smoke.spec.ts(Playwright: 크로미움 PC·모바일, WebKit PC + axe)
docs/                    기획서.md, design-vs-plan.md, step1-plan.md, performance.md, milestones.md, assets/credits.md
private/                 learning/, interview-questions.md (gitignore)
```

## 4. 규칙

### 네이밍
- 파일·폴더 kebab-case, 컴포넌트 PascalCase, 훅 `use*`.
- 러너 위치는 월드 픽셀 발 좌표 `pos: { x, y }`(배율 적용 전, 11-10 자유 이동). 트랙 거리 `t`·`s`는 인트로 한 바퀴와 자동 이동의 "레인 따라가기"에만 쓴다(변환은 `trackPath.ts`의 `toWorld`·`nearestS`). 화면 좌표는 카메라 컨테이너가 맡으므로 컴포넌트에서 직접 계산하지 않는다.
- 바라보는 방향(스프라이트)은 `'left' | 'right' | 'up' | 'down'`. 자유 이동은 입력 벡터로(`movement.facingOf`), 레인 위는 `trackPath.facing`.
- 키 입력은 `{ dx: -1|0|1, dy: -1|0|1 }`(↑↓←→·WASD 합산). 이동 규칙은 `features/track/movement.ts`(시안 값): 110px/s·대각선 정규화, 발 범위 x 10–630·y 48–358, 구조물(아치 제외)·신호등·심판·이정표 사각형을 좌우 8·위 2·아래 3px 넓힌 칸 + 관중석 전체가 충돌, 축별 판정으로 미끄러짐.
- 메뉴·구조물 id는 `'about' | 'career' | 'project1' | 'project2' | 'skill' | 'resume'`(11-10: 천막 = SKILL, EDUCATION 내용은 ABOUT ME 창으로). 화면 라벨은 `content/menu.ts`(ABOUT ME · PROJECT1 등 시안 표기). 인트로 전광판 글은 `content/intro.ts`의 `BOARD_STEPS`·`BOARD_LINES`, 이정표 3줄은 같은 파일의 `SIGN_LINES`.

### 게임 상태와 렌더
- 이동은 고정 틱(60ms)마다 위치를 갱신하고 CSS transition이 보간한다. 카메라 목표도 같은 틱에서 계산한다. `requestAnimationFrame` 루프 금지.
- 카메라: 캐릭터가 화면 가운데 여유 구간(가로·세로 각 40%) 안에 있으면 움직이지 않고, 벗어나면 따라간다. 월드 경계에서 멈춘다. 메뉴 자동 이동 중에는 캐릭터를 가운데에 둔다.
- 배치 데이터(`layout.ts`)는 트랙 상수, 구조물 6개의 `s`·`t`·스프라이트 위치·앞 지점, 이정표, 소품 좌표를 정의한다(관중·잔디 디테일은 생성 파일 `layout-stands.ts`). 반응 구역은 구조물 사각형 사방 20px(아래 22px) ∪ 앞 지점 ±14px(`movement.zoneAt`). 메뉴·지도 자동 이동은 앞 지점까지 90px 이내면 직선, 아니면 가까운 레인 지점 → 레인 따라 → (천막만) 앞 지점.
- 메뉴·미니맵·탭으로 가는 자동 이동은 `trackPath.shortestDirection(from, to)`로 방향을 정하고 2배 속도. 도착 시 창을 바로 연다. 키보드·버튼으로 달려 도착하면 `!`만 띄우고 Enter·Space·탭을 기다린다.
- 자기소개 문구는 인트로 한 바퀴에서만 전광판에 찍힌다(레인 옆 말풍선 없음). 평소 전광판은 "CAREER". 인사 말풍선·키캡 안내는 입력이 들어오면 즉시 사라지고 다시 나오지 않는다.
- 소품은 `Props`에서만 그리고 상태를 갖지 않는다. 구조물 반경 2칸 안에는 두지 않는다(`layout.ts`에서 검사하는 단위 테스트).
- 창이 열려 있으면 달리기 입력을 무시한다. Tab 키는 게임이 가로채지 않는다.

### 접근성
- 구조물·메뉴 아이콘·미니맵 점은 `<button>`에 `aria-label`("Open CAREER"). 캐릭터·타일·소품은 `aria-hidden`.
- 키보드 사용자는 메뉴 아이콘으로 창을 연다. 방향키 달리기는 입력칸·탭 목록·창 안에 포커스가 있을 때는 동작하지 않고(그쪽 몫), Enter·Space로 구조물 창 열기는 포커스가 바탕이나 월드일 때만. 창·지도 창이 열려 있으면 ←→는 이전·다음 구조물로 넘긴다. 모바일 ◀ ▶는 트랙 순서로 이전·다음 지점까지 달려가 창을 연다(11-10 시안 채택). 반응 구역에서는 `!` + "SPACE" 태그(PC) + 시각적 숨김 텍스트.
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
Claude가 모든 기능을 직접 구현한다(11-10 결정: 사용자가 직접 짜던 trackPath.ts·useRunner.ts도 Claude가 구현). 사용자는 "왜" 주석과 학습 노트로 공부한다.
절차는 nanaki·dahda와 같다.
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
