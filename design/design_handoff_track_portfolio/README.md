# Handoff: 박찬령 포트폴리오 — 400m 트랙 픽셀 게임

## Overview
프론트엔드 개발자 박찬령의 1인 포트폴리오 사이트. 위에서 내려다본 400m 육상 트랙(픽셀아트, SNES 16비트 톤)이 무대다. 첫 방문 시 출발 신호 인트로가 재생되고, 끝나면 같은 월드에서 바로 조작 모드로 넘어간다. 방문자는 두 가지 방법으로 6개 창(ABOUT ME · CAREER · PROJECT1 · PROJECT2 · SKILL · RESUME)을 연다.
1. 방향키로 캐릭터를 자유롭게 움직여 구조물 앞에서 SPACE(또는 Enter) → 창 열림
2. 상단(PC)/하단(모바일) 메뉴 버튼 또는 월드의 구조물을 클릭 → 캐릭터가 그 지점까지 자동으로 달려간 뒤 창이 열림

대상 사용자: 채용 담당자. 라이트 모드만. 효과음 없음. "일반 모드" 페이지 없음.

## About the Design Files
이 폴더의 파일은 **HTML로 만든 디자인 레퍼런스**다. 의도한 모양과 동작을 보여주는 프로토타입이지, 그대로 배포할 프로덕션 코드가 아니다. 대상 코드베이스의 기존 환경(React/Next.js 등)과 그 패턴·라이브러리로 **다시 구현**하는 것이 과제다. 아직 환경이 없다면 Vite + React + TypeScript를 권장한다(정적 사이트, 서버 불필요).

- `.dc.html` 파일은 디자인 도구의 컴포넌트 형식이다. `support.js`와 함께 같은 폴더에서 브라우저로 열면 동작한다(로컬 서버 필요: `npx serve prototype`).
- 그림은 모두 **코드로 픽셀 단위 생성**된다(`track-kit-v2.js`, `track-kit-v3.js`). `assets/`에 PNG로 미리 뽑아 두었으니 구현 시 PNG를 쓰면 된다. 그림을 고칠 때는 생성 코드를 고치고 PNG를 다시 뽑는다.
- `portfolio-game.js`는 프레임워크 없는 게임 엔진 참고 구현(캔버스 + 상태 머신)이다. 로직을 그대로 옮겨도 되고, 구조만 참고해도 된다.

## Fidelity
**High-fidelity.** 색·크기·타이포·타이밍 모두 최종값. 픽셀은 정확히 재현해야 한다(안티앨리어싱 금지, `image-rendering: pixelated`, 정수 배율).

## Files
| 파일 | 내용 |
|---|---|
| `prototype/Portfolio Game.dc.html` | **최종 동작 프로토타입이자 구현 기준.** 인트로 → 플레이 → 창 · 지도. 이 파일 하나만 보면 된다(다른 시안 없음) |
| `prototype/portfolio-game.js` | 게임 엔진: 타임라인, 이동·충돌, 카메라, 반응 구역, 렌더 |
| `prototype/portfolio-content.js` | 창 내용 데이터(텍스트만 여기서 수정). `TODO:` 값은 실제 내용으로 교체 |
| `prototype/track-kit-v3.js` | 월드 640×360 구성, 소품·관중·키캡·말풍선 그림, 트랙 거리 함수 |
| `prototype/track-kit-v2.js` | 팔레트, 타일, 구조물·신호등·심판 그림, 러너 16프레임 |
| `prototype/support.js` | 프로토타입 실행용 런타임(구현에는 불필요) |
| `assets/**` | 투명 PNG (1px = 1 월드 픽셀, 칸 간격 0) |

## World & Coordinate System
- 내부 해상도(월드): **640×360**. 화면 기준 영역은 320×180(월드의 1/2).
- 모든 그림은 32×32 격자 단위. 1 월드 픽셀 = 화면에서 S×S CSS px (S = 정수 배율).
- 트랙: 스타디움형(직선 2 + 반원 2). 반원 중심 a=(180,180), b=(460,180). 바깥 반지름 Ro=116, 안쪽 Ri=84 (레인 폭 32). 레인 선(흰색 1px) 반지름 84, 94, 105. 바깥 경계 115는 trackDark.
- 러너가 달리는 선: 반지름 **RM=100**. 둘레 **LEN=1188**. 트랙 거리 `s`(0~1188)로 위치를 표현한다.
  - `s=0`: 아래 직선 x=320(분필 출발선). s 증가 = 화면상 반시계 방향(아래 직선을 오른쪽으로 → 오른쪽 곡선 위로 → 위 직선 왼쪽으로 → 왼쪽 곡선 아래로).
  - `posAt(s)` → {x, y, dir}. 러너 발 위치 y = posAt.y + 12. 스프라이트 32×48은 (x−16, 발y−48)에 그린다.
- 관중석: y<32 전체 / x≥592 / (x≥512 & y<64, 트랙에서 8px 이상 떨어진 곳) / (x<48 & y≥128). 경계 아래 1px grassDark 선.

### 구조물 (중심 x, 바닥 y, 반응 지점 s)
| id | 메뉴 | 크기(px) | x | 바닥 y | s |
|---|---|---|---|---|---|
| arch | ABOUT ME | 96×64 (3×2) | 320 | 299 | 0 |
| waterB | PROJECT2 | 64×32 (2×1), 지붕 accent 노랑 | 416 | 64 | 498 |
| board | CAREER | 96×32 (3×1) | 320 | 140 | 594 |
| waterA | PROJECT1 | 64×32 (2×1), 지붕 tee 파랑 | 224 | 64 | 690 |
| tent | SKILL | 64×64 (2×2) | 40 | 98 | 823 |
| table | RESUME | 64×32 (2×1) | 216 | 340 | 1085 |
| signal | (인트로) | 32×64 | 392 | 360 | – |
| referee | (인트로) | 32×48 | 428 | 356 | – |
| signpost | (장식, 창 없음) | 48×50 | 좌상단 (200,186) | 236 | – |

**이정표(signpost)**: 인필드 왼쪽 아래 빈 곳. 나무 기둥 + 화살표 판 3장(→ ← →). 판 위 HTML 글자 Galmuri11 bold, 크기 max(10px, 4.4×S), ink. 글자 중심(좌상단 기준) (+21.5, +10.5) "경험은 넓게" / (+26.5, +23.5) "실행은 빠르게" / (+21.5, +36.5) "성장은 꾸준히"(`portfolio-content.js`의 `sign`). 충돌 칸 있음(통과 불가). 정적 월드 PNG에 이미 그려져 있지 않으니 `structures/signpost-48x50.png`를 위 좌표에 얹는다.

스프라이트 좌상단 = (x − floor(w/2), 바닥y − h). 클릭 판정 박스는 스프라이트 + 위 12px.

### 구조물 안 이름 (HTML)
제목 판은 없다. 메뉴명을 각 구조물의 빈 면 안에 Press Start 2P로 얹는다(월드 px 기준, 화면 = ×S).
| 구조물 | 글자 중심(스프라이트 좌상단 기준) | 크기 | 색 |
|---|---|---|---|
| arch 현수막 | (+48, +15) | 8px | ink. 인트로 중엔 "START", 끝나면(14.0s~) "ABOUT ME" |
| board 화면 | (+48, +11) | 8px | accent + 글로우 0 0 4px / 0 0 10px accent. 인트로 중엔 비움, 끝나면 "CAREER" |
| waterA/B 탁자 천 | (+32, +22) | 5px | ink |
| tent 카운터 | (+32, +54) | 7px | white |
| table 천 | (+32, +21) | 6px | ink |
반응 구역 안이면 구조물 실루엣 바깥 1px accent 외곽선(`-selected` PNG) + 러너 머리 위 "!" + 오른쪽에 "SPACE" 태그(흰 바탕, 2px ink, Press Start 2P 8px, PC만).

## Screens / States

### 1. Intro (첫 방문)
`introMode`: always | firstVisit(기본 권장, localStorage `pcr_intro_seen`) | never.

| 시간(s) | 배율 | 내용 |
|---|---|---|
| 0.0–0.6 | 월드 전체 Si=min(w/640,h/360) | 전체 흑백. 신호등 빨강, 띠 "ON YOUR MARKS". 러너 출발선 대기. 심판 깃발 듦 |
| 0.6–1.2 | 〃 | 신호등 노랑, 띠 "SET" |
| 1.2–1.8 | 〃 | 신호등 초록, 띠 "GO"(2.2s까지) |
| 1.8–10.0 | 〃 | 심판 깃발 내림. 러너 한 바퀴 + 80px(마지막 15% 감속) → 아치 오른쪽 (400,292)에서 멈춤(아치에 가리지 않게). 지난 구간만 컬러 |
| 1.8–2.2 | 〃 | 전광판이 제자리에서 화면 가운데로 커짐(정수 배율 k=floor(min(w×0.56, h×1.86)/96), 1280×720에서 672×224) |
| 2.2–9.4 | 〃 | 큰 전광판에 자기소개 문구 4개, 문구마다 1.8s. 켜질 때 0.28s 네온 깜빡임, 끝 0.14s 꺼짐. 진행 점 4개 |
| 9.4–10.0 | 〃 | 전광판이 제자리로 줄어듦 |
| 10.0–10.8 | Si → Sz (PC Sg+2=6, 모바일 3) | 캐릭터로 줌인 |
| 10.8–13.6 | Sz | 손 흔들기 + 말풍선 "WELCOME TO MY PORTFOLIO!" |
| 13.6–14.3 | Sz → Sg | 평소 카메라로 줌아웃, HUD 들어옴 |
| 14.3~ | Sg | ↑←→↓ 키캡 4개가 0.45s마다 차례로 눌림(모바일은 ◀ ▶ 깜빡임). 첫 입력 시 사라짐 |

**큰 전광판 네온 글자** (전광판 화면 = 전광판의 left 5.2% / top 9.4% / 폭 89.6% / 높이 50%):
- 위 띠(화면 높이의 24%, 배경 standDark, 아래 2px ink): Press Start 2P max(7px, 전광판 높이×0.045) "DISCOVER → PLAN → BUILD". 문구 1·2·3일 때 해당 단어만 accent + 글로우 0 0 6px accent, 나머지 metal. 문구 4에서는 셋 다 accent. 화살표 metal.
- 문구: Galmuri11 bold(전광판 높이×0.13) 흰색 + accent 글로우, 띠 아래 남은 영역 가운데.
  1 "문제를 찾고," · 2 "해결 방법을 기획하고," · 3 "실제 결과물로 만드는" · 4 "프론트엔드 개발자 박찬령입니다." (`board`, `boardSteps`)
- 흑백 필터 밖에 둬서 인트로 중에도 컬러.

- **SKIP**: 인트로 중 우상단(16px, 모바일 top 8px). 누르면 ready 상태로 즉시 이동.
- **REPLAY**: 좌하단(left 16, bottom 16 / 모바일 bottom 200) "▶ REPLAY" 버튼. 열린 창을 닫고 인트로를 처음부터 재생.
- **흑백→컬러 처리**: 같은 월드 그림을 두 층으로 겹친다. 아래층 CSS `filter: grayscale(1)`, 위층은 컬러 + 마스크. 마스크 = **부채꼴(시계 초침) 스윕**: 트랙 중심 (320,180)에서 각 월드 픽셀의 각도를 출발선 방향(아래)부터 달리는 방향(반시계)으로 잰 값 `θ = (π/2 − atan2(y−180, x−320)) mod 2π`가 러너의 같은 각도 이하인 곳만 불투명. 화면 전체(관중석 포함)가 피자 조각처럼 번진다. s ≥ 1188이면 전부 컬러. 10.0s 이후 아래층 숨김. 인트로 중 HTML 글자층도 grayscale.
- 띠: 화면 세로 가운데, 높이 96px, 배경 ink, 위아래 4px 흰 선, Press Start 2P 40px(모바일 22px) 흰색.
- 진행 점: 하단 가운데 24px, 16×16 칸 2px 흰 테두리, 켜짐 accent / 꺼짐 ink, 간격 12px, 배경 ink 패딩 8/12.

### 2. Play (조작)
- 배율 Sg = 모바일 2, PC max(2, floor(min(w/320, h/180))). 카메라는 러너(발y−24) 중심, 월드 경계 안에 고정.
- **이동만**: ↑↓←→ / WASD 8방향, 110 월드px/s(대각선 정규화). 트랙 밖 잔디·인필드 어디든. 발 범위 x 10–630, y 48–358.
- 충돌: 구조물(아치 제외)·신호등·심판 사각형을 좌우 8, 위 2, 아래 3px 넓힌 칸 + **관중석 전체**(발 좌우 ±6px, 발 위 6px까지 검사). 축별 판정(미끄러짐). 아치는 통과, 러너가 아치 안이면 아치를 위에 다시 그림.
- **선택**: 반응 구역(구조물 사각형 사방 20px, 아래 22px, 그리고 앞 지점 ±14px을 합친 영역) 안에서 SPACE/Enter → 창. 멈춰도 자동으로 열리지 않음.
- 클릭(구조물·메뉴·지도): 앞 지점까지 자동 달리기 후 창 열림. 90px 이내면 직선, 아니면 가까운 레인 지점 → 레인 따라 → (천막만) 앞 지점 (86,106). ×1.6 속도. 방향키로 취소.
- 모바일 ◀ ▶: 트랙 순서로 이전/다음 지점까지 자동 달리기 후 창 열림.
- 관중: 16×16, 4색 × 2프레임, 0.45s마다 교체, 사람마다 시작 프레임 엇갈림.

### 3. HUD
**로고(좌상단 16/16, 모바일 8/8)** — 판·테두리 없음.
- "ChanRyeong" Press Start 2P 24px(모바일 16) white, 2px ink 픽셀 외곽선(8방향 text-shadow 0 blur) + 아래 5px(모바일 4) ink 드롭.
- "PORTFOLIO" Press Start 2P 10px(모바일 8) accent, letter-spacing 2px, 같은 외곽선. 줄 간격 10px(모바일 8).

**PC (폭 ≥ 700)**
- 메뉴: 우상단 16/16, 버튼 6개 간격 4px. 높이 44, 9-slice 흰 판, 좌우 패딩 6, Press Start 2P 10px. 선택: 배경 #FFF6D6 + 2px accent outline(inset), `aria-current`.
- 미니맵(버튼): 우하단 16/16. 160×90(월드 1/4), 보이는 영역 2px accent, 러너 6×6 ink 점, 오른쪽 아래 "MAP" 태그. **클릭 → 큰 지도**.
- 조작 안내: 하단 가운데, 9-slice 판 높이 44, Galmuri11 13px "↑ ↓ ← → 이동 · SPACE 또는 클릭으로 선택".
- REPLAY: 좌하단 16/16 "▶ REPLAY" 9-slice 버튼 → 열린 창 닫고 인트로 처음부터.

**모바일 (폭 < 700)**
- 로고 좌상단, MAP 버튼 우상단(8/8, 높이 44).
- ◀ ▶: 64×64, 좌우 12, bottom 124. ready 동안 0.45s마다 번갈아 강조. REPLAY는 bottom 200.
- 메뉴: 하단 높이 112, ink 바탕, 패딩 8, 3×2 grid(간격 4), 버튼 높이 44, Press Start 2P 9px.

**큰 지도(모달)**
- 딤 rgba(30,38,56,.55) + 9-slice 흰 창, tee 머리 띠 "MAP" + 안내 "구조물을 누르면 그곳으로 달려갑니다" + ✕.
- 월드 정적 PNG를 배율 M = min((w−56)/640, (h−120)/360) (1 이상이면 0.5 단위 내림)로 표시.
- 구조물마다 버튼(스프라이트 사각형, 2px accent 테두리, hover accent 35% 채움, 가운데 ink 라벨 Press Start 2P 10px). 누르면 지도 닫고 그 지점으로 자동 달리기 → 창. 러너 위치 10×10 ink 점. Esc/✕/딤 클릭으로 닫기, 열릴 때 ✕에 포커스.

### 4. Window (창)
- 배경 딤: rgba(30,38,56,.55), 클릭 시 닫기.
- PC: 가로 가운데, top 56, 폭 min(720px, 100%−32), max-height 100%−112. 모바일: 아래 붙임(bottom 8), 폭 100%−16, max-height 78%.
- 테두리: 9-slice 흰 판(8px). 머리 띠: 배경 tee #2E9BE0, 아래 2px ink, 패딩 8/8/8/12. 제목 Press Start 2P 16px 한 줄만(PROJECT는 프로젝트명, 부제 없음). ◀ ▶(이전/다음 지점, 메뉴 순서 순환) · ✕ 40×40 흰 9-slice 버튼.
- 본문: 패딩 24/28/28, 섹션 간격 28, Pretendard 16px / 1.6, 세로 스크롤.
- 섹션 제목: Galmuri11 15px bold + 8×8 tee 사각형(1px standDark 외곽).
- 섹션 타입(`portfolio-content.js`): `text`(문단) · `stats`(2px ink 테두리 카드, 라벨 13px metalDark, 값 Galmuri11 22px bold) · `list`(번호 01/02… 또는 ·, 굵은 태그 + 15px 설명, 2열 auto-fit min 280px) · `timeline`(기간 120px 열 Galmuri11 14px standDark + 제목/설명, 행 아래 2px metalLight) · `links`(9-slice 버튼, primary는 tee 바탕).
- `TODO`로 시작하는 값은 metal 회색으로 표시(내용 미정 표시용 — 실제 내용 입력 후 제거).
- 열리면 ✕에 포커스. Esc 닫기. 창 안에서 ←/→ = 이전/다음 지점(버튼·링크에 포커스가 없을 때). 닫히면 게임 입력 복귀.

## State Management
```
phase: 'intro' | 'ready' | 'play'
t: 인트로 경과 시간(s)
s: 러너 트랙 거리 (0..1188, 순환)
dir: 'up'|'down'|'left'|'right'; anim: 누적 이동 거리(걷기 프레임용)
hold: -1|0|1 (키/버튼 누름)
auto: {id, s} | null  (메뉴/클릭으로 자동 달리기)
zone: stationId | null; idle: 구역 안 정지 시간; dismissed: 방금 닫은 지점
open: stationId | null
firstInput: boolean (키캡 힌트 숨김)
viewport: w, h, mobile(w<700) → S, camera(cx, cy)
```
전이: intro —(9.4s 또는 SKIP 또는 메뉴 클릭)→ ready —(첫 입력)→ play. 인트로 종료 시 localStorage `pcr_intro_seen=1`. 데이터 요청 없음(정적 콘텐츠).

## Design Tokens
**Palette (16색, 이 외 사용 금지)**
| token | hex | | token | hex |
|---|---|---|---|---|
| track | #C0563F | | metal | #959EAE |
| trackDark | #7E3226 | | metalDark | #545D70 |
| skinShade | #E3A68A | | skin | #F7CFB2 |
| grass | #6FB24B | | hair | #5B3A2B |
| grassDark | #3E7A34 | | tee | #2E9BE0 |
| stand | #6F86C2 | | white | #FFFFFF |
| standDark | #3D4E86 | | accent | #F5C431 |
| metalLight | #D6DBE3 | | ink | #1E2638 |

(프롬프트 원안의 `line #F7F4EC`는 확정 캐릭터 v4가 쓰는 `skinShade #E3A68A`로 대체됨. 레인 선은 white.)

UI 전용: 메뉴 선택 바탕 #FFF6D6, 딤 rgba(30,38,56,.55). UI 토큰 이름 제안: color.bg=grass, color.surface=white, color.text=ink, color.primary=tee, color.focus=accent, color.muted=metalDark.

**Spacing**: space.1=4 · 2=8 · 3=12 · 4=16 · 5=20 · 6=24 · 7=28 · 8=32 (px). **Radius: 0** (전부). **Shadow 없음** — 구조물 그림자는 바닥 1px 어두운 줄(잔디 grassDark / 트랙 trackDark / 관중석 standDark).

**Typography**
- Press Start 2P — 로고, 구조물 안 이름(월드 5–8px), 메뉴 10/9px, 창 제목 16px, 인트로 띠 40px, SKIP 12px, 인사말 16px.
- Galmuri11 — 한글 픽셀 글자: 섹션 제목, 조작 안내, 큰 전광판 경력 줄.
- Pretendard — 창 본문 16/1.6, 보조 13–15px.
- CDN: `galmuri@latest/dist/galmuri.css`, `pretendard@v1.3.9`, Google Fonts Press Start 2P.

**9-slice 테두리** (24×24 원본, slice 8, `border-image-repeat: repeat`): 바깥 2px ink, 모서리 2px 계단, 오른쪽·아래 안쪽 2px 음영(흰 판은 metal, 파랑 판은 standDark). 원본 SVG는 `Portfolio Game.dc.html` 안 border-image 데이터 URL 참고.

**Focus**: `:focus-visible` → 2px accent outline + offset 2 + 4px ink 바깥 그림자. 대비 WCAG AA.

## Assets (`assets/`, 모두 투명 PNG, 1px = 1 월드 px)
- `world/world-640x360-no-runner.png` — 신호등·심판·러너 없는 정적 월드(관중 프레임 0). 전광판 화면은 빈 검정.
- `structures/*` — 구조물 6종 + 이정표 `signpost-48x50.png` + `-selected`(1px accent 외곽선, 사방 1px 커짐) + 빈 전광판.
- `intro/*` — 신호등 4상태, 심판 2프레임.
- `character/runner-sheet-128x240.png` — 행: down, up, right, left (각 4프레임 32×48), 5행째: 인사 2프레임.
- `props/props-sheet-128x64.png` — 소품 8종(4×2): 벤치, 콘, 물통, 가방 / 잔디 패치 1, 잔디 패치 2, 수건 걸이, 아이스박스.
- `props/spectators-64x32.png` — 관중 4색(열) × 2프레임(행: 손 듦, 손 내림).
- `tiles/*` — 트랙·잔디·잔디 점·관중석 32×32 (이음새 없음).
- `ui/*` — "!" 2프레임, 키캡 뗌/눌림, 인사 말풍선 판.

소품·관중 배치 좌표는 `track-kit-v3.js`의 `PLACED`, `SPECTS`(결정적 해시 배치) 참고. 또는 정적 월드 PNG를 배경으로 쓰고 관중만 애니메이션 레이어로 올려도 된다.

## Implementation Notes
- 캔버스는 화면 CSS 크기 그대로 두고 `imageSmoothingEnabled=false`로 월드 영역을 배율 S로 그린다. HTML 글자층은 같은 카메라 변환으로 절대 위치.
- 모든 HTML 글자 위치 = (월드x − cx)×S, (월드y − cy)×S.
- 프로토타입은 rAF + 120ms 감시 타이머로 루프를 돈다(백그라운드 탭 대비). 실제 구현에선 rAF만으로 충분.
- 접근성: 캔버스에 `role="img"` + 설명, 메뉴는 `<nav>`의 `<button>`, 창은 `role="dialog" aria-modal`. 키보드만으로 모든 창 접근 가능(메뉴 Tab → Enter).
- 실제 브랜드 로고 금지. 메달·트로피 등 "대회 성과" 장식 금지.

## Open Items
- 전광판 평소 표시(인트로 후)는 "CAREER" 글자만. 
- `portfolio-content.js`의 `TODO:` — CAREER 각 경력 설명, PROJECT 2(dahda) 전체, 모든 링크 URL, 이메일, 이력서 PDF.
