# step1 준비: 배치 데이터 · 상태 흐름 · 작업 목록 · 접근성 체크리스트

2026-11-09. `docs/claude-code-prompt.md`의 "첫 작업" 1·2·3·5번. 4번(trackPath·useRunner 설계 안내)은 `private/learning/00-roadmap.md`에 있다. 11-10부터 두 파일도 Claude가 구현한다.
Design과 기획서의 차이는 `docs/design-vs-plan.md`에 따로 정리했다.

## 0. 사용자가 정할 것 (추천안 포함)

| # | 결정 | 추천 | 이유 |
|---|---|---|---|
| D1 | PROJECT 1·2 급수대 위치 | project1 = 오른쪽 급수대(x 416, t 0.419), project2 = 왼쪽(x 224, t 0.581) | 반시계로 돌 때 1 → 2 순서. 그림 수정 없이 데이터만 |
| D2 | 인트로 한 바퀴 도착 위치 | t = 0(출발선), 러너 레이어 z-index를 구조물보다 위 | 기획서 그대로. 아치 현수막과 5px만 겹침 |
| D3 | 배율 규칙 | `clamp(floor(min(w/320, h/180)), 2, 4)` | 항상 320×180 월드 창 보장. 1280×720→4, 1024×768→3, 768×1024·390×844→2 |
| D4 | 반응 구역 길이 | 트랙 거리 ±24px(t ±0.0202) | 러너 폭 32의 3/4. 두 구조물 구역이 겹치지 않음(최소 간격 96px) |
| D5 | step1 그림 파일 | 개별 PNG 그대로, step3에서 시트 합치기 | 합치기 전후 측정을 `performance.md`에 남길 수 있음 |
| D6 | 러너 속도 | 100 px/s(한 바퀴 11.9초), 틱 60ms → 6px/틱, 자동 12px/틱 | 기획 "약 12초" |

"step1 시작"이라고 하면 위 추천대로 간주하고 시작한다. 다른 선택이면 번호와 값만 알려 주면 된다.

## 1. 배치 데이터 `features/track/layout.ts` 타입 제안

### 1-1. 트랙 경로: 점 근사가 필요 없다

Design 트랙은 타원이 아니라 **스타디움형**(직선 2 + 반원 2)이다. 네 구간 모두 닫힌 식으로 좌표·접선이 나오므로 폴리라인으로 근사할 이유가 없다.
근사하면 (1) 꼭짓점 수만큼 방향이 튀어 스프라이트가 깜빡이고, (2) 최단 방향·거리 계산이 세그먼트 탐색으로 복잡해지며, (3) 미니맵 path와 월드 좌표가 어긋난다.
`trackPath.ts`는 `s = t × length`를 받아 "어느 구간인가" 분기 4개로 좌표를 돌려주면 된다.

```ts
// 월드 픽셀 단위(배율 적용 전). 변환은 trackPath.ts 한 곳에서만.
export interface StadiumTrack {
  kind: 'stadium';
  centerLeft: { x: 180; y: 180 };   // 왼쪽 반원 중심
  centerRight: { x: 460; y: 180 };  // 오른쪽 반원 중심
  laneRadius: 100;                   // 러너가 달리는 선(레인 84~116의 가운데)
  startX: 320;                       // s=0 = 아래 직선 분필선
  footOffsetY: 12;                   // 발 = 선 + 12
  length: number;                    // 2·280 + 2π·100 ≈ 1188.32 (상수로 계산해 둔다)
}
```

### 1-2. 전체 타입

```ts
export type LandmarkId = 'about' | 'career' | 'project1' | 'project2' | 'education' | 'resume';
export type LandmarkSprite = 'arch' | 'scoreboard' | 'water-a' | 'water-b' | 'tent' | 'table';
export type PropKind = 'bench' | 'cone' | 'bottle' | 'bag' | 'grassA' | 'grassB' | 'towel' | 'cooler';

export interface WorldLayout {
  size: { w: 640; h: 360 };
  tile: 32;
  track: StadiumTrack;
  landmarks: readonly Landmark[];       // 6개, t 오름차순
  introActors: readonly IntroActor[];   // 신호등·심판(인트로에만 보임)
  props: readonly Prop[];               // 소품, 상태 없음
  stands: readonly Rect[];              // 관중석 띠 영역(타일 반복 범위)
}

export interface Landmark {
  id: LandmarkId;
  sprite: LandmarkSprite;
  t: number;                 // 0 이상 1 미만. 반응 지점(러너가 서는 자리)
  zoneHalfLength: number;    // 트랙 거리(px). 판정은 |sdist| <= 이 값
  anchor: { x: number; y: number }; // 스프라이트 가운데 x, 바닥 y (Design 표 그대로)
  size: { w: number; h: number };   // 96×64 등. 좌상단 = (x − w/2, y − h)
  label: { dx: number; dy: number }; // 이름 글자 중심(좌상단 기준)
}

export interface IntroActor { id: 'signal' | 'referee'; anchor: { x: number; y: number }; size: { w: number; h: number } }
export interface Prop { kind: PropKind; x: number; y: number }   // 32×32 칸 좌상단
export interface Rect { x0: number; y0: number; x1: number; y1: number }
```

인트로 전광판 문구 4개와 바뀌는 t는 **`content/intro.ts`의 `BOARD_LINES`**에 둔다(11-10 결정, 글은 content에만).

```ts
export interface BoardLine { t: number; text: string; highlight: readonly number[] }  // t = 0.05 · 0.3 · 0.55 · 0.8
```

### 1-3. 값(Design 실측, D1 반영)

| id | sprite | anchor(x, 바닥y) | size | s | **t** | label dx,dy |
|---|---|---|---|---|---|---|
| about | arch | 320, 299 | 96×64 | 0 | 0.0000 | 48, 15 |
| project1 | water-a | 416, 64 | 64×32 | 498 | 0.4192 | 32, 22 |
| career | scoreboard | 320, 140 | 96×32 | 594 | 0.5000 | 48, 11 |
| project2 | water-b | 224, 64 | 64×32 | 690 | 0.5808 | 32, 22 |
| education | tent | 40, 98 | 64×64 | 823 | 0.6928 | 32, 54 |
| resume | table | 216, 340 | 64×32 | 1085 | 0.9133 | 32, 21 |
| (signal) | – | 392, 360 | 32×64 | – | – | – |
| (referee) | – | 428, 356 | 32×48 | – | – | – |

- t는 `s / 1188.3185`. 코드에서는 s(px)를 적고 t는 계산해 두는 편이 읽기 쉽다(`t: sToT(498)`).
- 러너가 서는 자리(발): about (320, 292) · project1 (416, 92) · career (320, 92) · project2 (224, 92) · education (102, 129) · resume (217, 292).
- 관중석: y<32 전체 / x≥592 / (x≥512 & y<64, 트랙 바깥 8px 이상) / (x<48 & y≥128).
- 소품 18개 좌표는 step1 작업 2에서 Design `PLACED`를 Node로 한 번 실행해 뽑아 상수로 적는다(실행 시 계산 금지).

### 1-4. `layout.test.ts`로 검사할 것

1. **소품은 구조물 반경 2칸(64px) 밖**: 모든 (prop, landmark) 쌍에서 사각형 간격 `gap >= 64`. 기획서 규칙 그대로.
2. 소품끼리 16px 이상 떨어짐, 소품이 트랙(레인 84~116)·관중석 위에 없음(중심점의 트랙 거리로 검사).
3. 구조물 `t`는 `[0, 1)`이고 **오름차순**이며 id 6개가 전부 한 번씩.
4. 반응 구역이 서로 겹치지 않음: 인접 구조물 간 `sdist > 2 × zoneHalfLength`.
5. 구조물 스프라이트 사각형이 월드 안(0~639, 0~359)에 있음.
6. 인트로 milestone `t`가 오름차순이고 3개.
7. 러너가 서는 자리(`toWorld(landmark.t)`)가 해당 구조물 anchor에서 60px 이내(배치 실수 방지. 천막만 70px 허용).

## 2. 상태 흐름

### 2-1. 달리기 상태 머신 (`useRunner.ts`)

```
          키/◀▶ 누름            키 뗌 · 수직 입력
 idle ───────────────▶ running ─────────────▶ idle
   ▲                     │
   │  메뉴·미니맵·탭·구조물 클릭 = 목표 t 설정(auto)
   │                     ▼
   │                  running(auto, 2배, 카메라 가운데 고정)
   │                     │ |sdist(t, target)| < 한 틱 거리 → t = target
   │                     ▼
   └──── 창 닫힘 ───── arrived ── 메뉴 출발이면 즉시 창 열기 / 키 출발이면 ! 띄우고 Enter·Space 대기
```

| 상태 | 들어올 때 | 틱마다(60ms) | 나갈 때 |
|---|---|---|---|
| idle | 입력 없음 | 반응 구역 안이면 `zone = id`(`!` 표시) | 입력 → running |
| running(manual) | keyToDirection ≠ null | `t += dir × 6px/길이`, 0~1 감기(wrap), 카메라 목표 갱신 | 입력 끝 → idle |
| running(auto) | 목표 t 설정 | `t += shortestDirection × 12px/길이`, 남은 거리 < 12px면 target에 스냅 | 도착 → arrived. 방향키 입력 → auto 취소 후 manual |
| arrived | 자동 도착 | 창 열기(`open = id`) | 창 닫힘 → idle(그 자리) |

입력 → 방향 (B안). `dx, dy ∈ {−1,0,1}`을 ↑↓←→·WASD 합산 후 **현재 지점의 접선 단위벡터와 내적**:

| 지점 | 접선(ccw 방향) | ← (−1,0) | → (1,0) | ↑ (0,−1) | ↓ (0,1) | ↑+← |
|---|---|---|---|---|---|---|
| 아래 직선 | (1, 0) | cw | ccw | null | null | cw |
| 오른쪽 커브 중앙 | (0, −1) | null | null | ccw | cw | ccw |
| 위 직선 | (−1, 0) | ccw | cw | null | null | ccw |
| 왼쪽 커브 중앙 | (0, 1) | null | null | cw | ccw | cw |
| 커브 45° 지점 | (±0.7, ±0.7) | 내적 부호로 결정. 두 키 동시면 합 벡터로 내적 | | | | |

내적 > 0 → ccw, < 0 → cw, |내적| < 0.2(거의 수직) → null(멈춤). 접선은 `trackPath.tangent(t)`.

### 2-2. 카메라 (같은 틱에서 계산)

```
뷰포트(월드 px) = (vw / scale, vh / scale)          예) 1280×720, 4× → 320×180
여유 구간 = 화면 가운데 40% 상자 = (128×72)
러너 기준점 = (x, footY − 24)                         스프라이트 세로 중앙
평소:   기준점이 여유 상자 안 → 카메라 그대로. 밖 → 벗어난 만큼만 이동
자동:   카메라 중심 = 기준점(캐릭터 가운데 고정)
경계:   cx ∈ [0, 640 − vw], cy ∈ [0, 360 − vh]. 뷰포트가 월드보다 크면 가운데 정렬 ((640 − vw)/2)
적용:   월드 컨테이너 transform: translate3d(−cx·scale, −cy·scale, 0), transition 60ms linear
reduced-motion: transition none
```

### 2-3. 인트로 흐름 (`features/intro`)

| 단계 | 시간 | 배율 | 보이는 것 | 입력 |
|---|---|---|---|---|
| 프리로드 | 실제 완료까지 | 평소/2 | 출발선 러너 정지, 필요하면 여기서만 로딩 표시 | SKIP |
| 신호등 | 1.5s | 평소/2 (PC·태블릿 2×, 모바일 1×) | 빨강→노랑→초록 0.5s 간격, 가운데 "ON YOUR MARKS"→"SET"→"GO", 초록에 심판 깃발 내림 | SKIP |
| 한 바퀴 | 5.0s | 〃 | t 0→1 선형(한 바퀴), 전광판 글자 t 0.1 / 0.45 / 0.8에서 3줄 교체 + 진행 점. 전광판이 화면 밖(모바일 1×에서 뷰포트가 좁을 때)이면 상단 띠 | SKIP, 아무 키·탭 → 인사로 |
| 줌인 | 0.4s | 2→3→4 (각 0.2s, 정수만) | 러너 중심으로 확대, HUD·미니맵 등장, 전광판 "2013 → 2026" | – |
| 인사 | 2.5s | 평소 | 정면 손 흔들기 2프레임 + 말풍선 "WELCOME TO MY PORTFOLIO!" | **조작 허용.** 입력 시 말풍선 즉시 제거 |
| 키캡 안내 | 첫 입력까지 | 평소 | 러너 양옆 ← → 키캡 번갈아 눌림(모바일은 ◀ ▶ 깜빡임) | 첫 입력에 제거, `introSeen = 1` 저장 |
| 끝 | – | 평소 | 왼쪽 아래 ▶ REPLAY | REPLAY → 열린 창 닫고 신호등부터 |

분기:
- **SKIP·아무 키**: 인사 단계로 점프(배율은 평소로 즉시, 러너는 t=0).
- **재방문**(`introSeen` 읽기 성공 & 1): 평소 배율에서 `짧은 인사(1.5s) → 키캡`만.
- **localStorage 실패**(try/catch): 본 것으로 취급 → 재방문 흐름.
- **reduced-motion**: 신호등·한 바퀴·줌·손 흔들기 생략. 인사 말풍선 고정 표시(입력 전까지), 이동·카메라 transition 없음, 창 애니메이션 없음.
- 창이 열려 있으면 달리기 입력 무시. 창·MAP 창 안에서 ←→는 이전·다음 구조물(= 자동 이동 + 도착 즉시 창 교체).

## 진행 상황 (11-10)

- 작업 1 셋업·토큰·폰트: 완료
- 작업 2 layout.ts + 테스트: 완료(소품은 시안 규칙상 11개)
- 작업 3 trackPath: 완료(11-10, 사용자 작성 규칙 폐지 후 Claude 구현). 터치용 문턱 없는 판정 추가
- 작업 4 World·TrackScene·Runner·store·배율: 완료. 러너가 움직이려면 작업 3·5(사용자)가 필요
- 작업 5 useRunner: 완료(11-10). 방향 잠금(같은 키를 누르는 동안 방향 유지), 메뉴 버튼 포커스에서도 방향키 동작
- 작업 6 타일 배경·관중석: 완료(트랙 고리 곡선은 design-vs-plan #15 결정 대기). 배율 계산은 작업 4에서 함께 끝냄
- 작업 7 구조물 6개 버튼·이름·선택 외곽선·`!`·이정표·소품: 완료. Enter·Space로 열기와 클릭 후 달려가기는 useRunner(사용자) 연결 후 동작
- 작업 6 보완: 트랙 고리를 투명 PNG(3KB)로 교체(11-10 결정)
- 작업 8 창: Radix Dialog, 9-slice 테두리, 이전·다음(트랙 순서), ←→, ESC, 열릴 때 ✕ 포커스: 완료
- 작업 9 창 내용: 섹션 렌더러 + content/panels.ts. 문구는 기획서 기준, 모르는 칸은 TODO(사용자가 채움). resume.pdf 파일 없음
- 작업 10 메뉴(PC 상단) + 이름 띠: 완료. useRunner 전까지는 메뉴 클릭 = 창 바로 열기(임시 연결, Game.tsx)
- 작업 11 미니맵 SVG + 점 버튼 6개: 완료
- 작업 12 러너 스프라이트: 완료(달릴 때 steps(4), 서 있으면 1번 칸)
- 작업 13·14 인트로 1차·인사·키캡·REPLAY: 완료. 끝 위치 +80px, 전광판은 화면 가운데 큰 판(design-vs-plan #18·19)
- 작업 15 ◀ ▶: 완료(11-10). 화면 기준 좌우, 커브 한가운데서도 달림. 폭 700 미만에서만 보임(모바일 하단 메뉴 바는 step2)
- 작업 16 E2E 6개 + axe + GitHub Actions: 완료. **Vercel 배포는 원격 저장소·Vercel 연결 후**

## step2 진행 (11-10)

- 모바일 하단 메뉴 바(3×2)·◀ ▶ 위치·MAP 창(큰 지도, 구조물 누르면 달려감): 완료
- 미니맵 현재 화면 네모: 완료
- 인트로 흑백 → 컬러(부채꼴): 완료. 모바일 전광판은 큰 전광판 방식이라 별도 띠 불필요
- 창 열림·닫힘 애니메이션(CSS): 완료. 손 흔들기·말풍선 깜빡임은 스프라이트 CSS로 이미 동작. idle 숨쉬기는 시트에 프레임이 없어 보류
- E2E: WebKit PC·크로미움 모바일 추가(24 통과)
- 화면 비교(스크린샷 기준선)는 CI 리눅스에서 기준선을 만들어야 해서 원격 저장소 연결 후
- Lighthouse CI(GitHub Actions) + 로컬 측정 기록(docs/performance.md): 모바일 0.92, 첫 화면 JS 146.9KB, 달리기 중 Layout 1회
- README 작성(GIF는 배포 후)

## 3. step1 작업 목록 (각 1~2시간, "끝났을 때 보이는 것" 포함)

| # | 작업 | 끝났을 때 보이는 것 |
|---|---|---|
| 1 | 프로젝트 셋업: Next.js(App Router)·TS strict·Tailwind·ESLint/Prettier·Vitest·Zustand, `styles/globals.css` 16색 토큰 + `--scale`, 폰트 3종 OFL 다운로드 후 `next/font/local`, `.gitignore`에 `private/` | `npm run dev`로 초록 배경 빈 월드. `lint`·`typecheck`·`test` 통과 |
| 2 | `layout.ts` + `layout.test.ts`: 1장의 타입·값, Design `PLACED`에서 소품 18개 좌표 추출 스크립트(`scripts/extract-props.mjs`, 1회) | 테스트 7개 초록. 소품 좌표 상수 |
| 3 | **(사용자)** `trackPath.ts` 1차: `toWorld`·`tangent`·`facing`·`shortestDirection`·`signedDistance`·`keyToDirection`. Claude는 테스트 먼저 작성 | `trackPath.test.ts` 초록(구간 경계 s=140·454·734·1048, wrap, 정반대 0.5 거리) |
| 4 | 임시 색 블록 월드: `World`(카메라 컨테이너) + `TrackScene`(트랙 띠·인필드 색 블록) + `Runner`(32×48 네모) + `store.ts` | **첫 이정표**: 네모 캐릭터가 방향키로 트랙을 따라 돌고 카메라가 따라감(여유 구간·경계) |
| 5 | **(사용자)** `useRunner.ts`: 상태 머신·틱·키 합산·카메라 목표. Claude는 테스트·힌트 | ↑↓←→·WASD 전부 동작, 창 열림 중 무시, 뗄 때 멈춤 |
| 6 | 배율 계산 `useScale`(D3) + `image-rendering: pixelated` + 타일 4종 배경(`background-repeat`) + 관중석 띠 | 창 크기 바꾸면 2·3·4 중 하나로만 바뀜. 트랙·잔디·관중석 타일 |
| 7 | 구조물 6개 `Landmark`(버튼, aria-label, 구조물 안 HTML 이름) + 전광판 `Scoreboard` 평소 글자 + 반응 구역 `!` + Enter·Space로 열기 | 구조물 앞에 서면 `!`, Enter로 빈 창 |
| 8 | 창 `components/ui/Dialog`(Radix + 픽셀 테두리 9-slice) + 이전·다음 버튼 + ESC | 6개 빈 창이 키보드로 열리고 닫힘 |
| 9 | `content/` 6개 데이터 이식(기존 사이트·PDF 문구) + `panels/` 6개(About 탭은 Radix Tabs) | 창 6개에 실제 글, ABOUT PROFILE·SKILLS 탭 |
| 10 | 메뉴 아이콘 6개(PC 상단) + 자동 이동(최단 방향·2배·카메라 중심 고정) + 도착 즉시 열기 | 메뉴 클릭 → 캐릭터가 가까운 쪽으로 달려가 창 열림 |
| 11 | 미니맵 SVG(PC): 스타디움 path + 점 6개 버튼 + 러너 점(현재 화면 네모는 step2) | 점 클릭 = 메뉴와 동일 |
| 12 | 러너 스프라이트 시트 적용(`sprites.css`, 4방향 × 4프레임 `steps(4)`), idle은 1프레임 | 네모 대신 달리는 캐릭터, 방향 전환 |
| 13 | 인트로 1차: 신호등 → 절반 배율 한 바퀴 + 전광판 3줄 + 진행 점 → 정수 줌 2단계(흑백→컬러 없음), SKIP, `introSeen`, reduced-motion 분기, 프리로드(`fonts.ready` + `decode()`) | 첫 방문에 약 7초 인트로, 두 번째 방문엔 바로 트랙 |
| 14 | 인사 말풍선·키캡 안내·REPLAY(Design PNG 그대로) | 인사 → 키캡 → 첫 입력에 사라짐, ▶ REPLAY 동작 |
| 15 | 터치 ◀ ▶ 버튼을 키보드와 같은 훅에 연결(모바일 배치는 step2) | 버튼 누르고 있으면 달림 |
| 16 | Playwright E2E 1개(첫 방문 → SKIP → 메뉴 → 창) + axe, GitHub Actions(lint·typecheck·unit·E2E), Vercel 배포 | 배포 주소에서 동작, CI 초록, `docs/milestones.md` 첫 줄 |

순서 메모: 3·5는 사용자 작업이라 Claude는 그 사이에 4·6·7을 먼저 만들고, 임시 선형 경로 stub으로 연결해 둔다(사용자 파일이 오면 교체).

## 4. 접근성 체크리스트 (step1에서 확인)

- [ ] **키보드만으로 6개 창**: Tab으로 메뉴 아이콘 6개 순회 → Enter → 창 열림 → ESC 닫힘. 월드에 포커스 없이도 가능.
- [ ] 메뉴 아이콘·구조물·미니맵 점은 `<button aria-label="Open CAREER">`. 구조물 안 이름은 라벨과 중복 읽기 방지(`aria-hidden` 또는 라벨에 포함).
- [ ] **포커스 순서**: 번호표 띠(정적) → 메뉴 6 → 월드(단일 tabstop, `tabindex=0`, 방향키는 여기서만) → ◀ ▶ → 미니맵 점 6(트랙 순서) → REPLAY. Tab은 게임이 가로채지 않음.
- [ ] Dialog: Radix 기본(포커스 트랩·ESC·`aria-labelledby`=h2). 열릴 때 닫기 버튼 또는 제목에 포커스, 닫히면 연 버튼으로 복귀.
- [ ] 창 안 ←→ = 이전·다음 구조물. 단 버튼·링크·탭에 포커스가 있을 때는 가로채지 않음.
- [ ] ABOUT 탭(Radix Tabs): ←→로 PROFILE·SKILLS 이동, `aria-selected`.
- [ ] `prefers-reduced-motion`: 카메라·러너 transition 0, 인트로 생략, 창 애니메이션 없음. Playwright `reducedMotion: 'reduce'`로 1회 확인.
- [ ] 신호등: 색 + 글자 "ON YOUR MARKS"/"SET"/"GO"(DOM 텍스트, `aria-live="polite"`).
- [ ] `!` 말풍선: 아이콘 + 시각적 숨김 "Press Enter to open CAREER".
- [ ] 캐릭터·타일·소품·심판·신호등 그림은 `aria-hidden`. 캔버스 없음.
- [ ] 스크린리더 읽는 순서: 시각적 숨김 h1 "박찬령 포트폴리오" → 이름 띠 → 메뉴 → 월드 설명 한 줄(`aria-describedby`) → 창 내용.
- [ ] 포커스 표시: `:focus-visible` 2px accent outline + ink 그림자, 대비 AA. 초록 잔디 위 흰 버튼 글자 대비 확인.
- [ ] axe(Playwright) 위반 0. `html lang="ko"`, 영어 라벨은 짧아 별도 `lang` 지정 안 함.
