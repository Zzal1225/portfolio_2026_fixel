# 성능 기록

규칙(CLAUDE.md 4장): 바꾸기 전 수치를 먼저 재고, 전후를 측정 조건·스크립트와 함께 남긴다.
아래는 전부 **로컬 프로덕션 빌드**(`npm run build && next start`, Windows 10, Chrome 안정판) 기준이다.
배포 주소(Vercel) 측정은 배포 후 같은 표에 추가한다.

## 1. 첫 화면 로딩 (Lighthouse 모바일, 2026-11-10)

측정: `CHROME_PATH=<chrome> npx lhci collect --numberOfRuns=3 [--settings.throttlingMethod=devtools]` → `node scripts/lh-summary.mjs`
설정 파일: `lighthouserc.json`. 3회 중앙값.

| 단계 | 바꾼 것 | 성능 | LCP | 첫 화면 JS(압축) | 전체 전송량 | 접근성 |
|---|---|---|---|---|---|---|
| 전 (모의 측정) | – | 0.81 | 5.0 s | 164.9 KB | 649 KB | 0.96 |
| 전 (devtools 스로틀링) | – | 0.87 | 2.6 s | 164.9 KB | 649 KB | 0.96 |
| 1 | 창·MAP 창 `next/dynamic`(즉시 로드) | 0.81 (모의) | 5.0 s | 170.4 KB | – | – |
| 2 | 본문 폰트 Pretendard를 창 안으로 한정, 선택 외곽선 그림을 선택 시에만, `<link rel=preload>`를 첫 화면 그림 4장으로 | 0.92 | 1.5 s | 170.4 KB | 389 KB | 0.96 |
| 3 | 창 코드를 "처음 필요해질 때"만 받기(store.panelsNeeded), MAP 창 분리, SKIP은 하이드레이션 후 | **0.92** | **1.5 s** | **146.9 KB** | 363 KB | **1.00** |

PC(데스크톱 프리셋, 모의 측정): 변경 전 성능 0.99, LCP 1.0 s.

읽는 법
- **모의 측정 5.0 s의 정체**: 실측 LCP는 0.2 s였다. localhost에서는 JS가 즉시 받아져 첫 그림보다 먼저 실행되고,
  Lighthouse 모의 측정(느린 CPU 4배)은 그 JS 실행을 LCP 경로에 넣어 계산한다. 그래서 개선 판단은 devtools 스로틀링(실제로 느린 네트워크·CPU를 걸고 재는 방식) 값으로 했다.
- **실제 병목은 다운로드 경쟁**이었다: 한글 폰트 2개(Pretendard 261 KB, Galmuri 163 KB)가 첫 화면에서 최우선으로 받아지며 LCP 요소(트랙 고리 그림, 3 KB)를 늦췄다.
  Pretendard를 창 안으로 한정하자 LCP 2.6 s → 1.5 s, 전송량 649 KB → 389 KB.
- **첫 화면 JS 목표 150 KB**: React·Next 런타임이 약 134 KB로 고정. 줄일 수 있는 건 창(Radix Dialog·Tabs·창 문구, 약 24 KB)뿐이라 처음 필요할 때 받게 했다.
  1단계(`dynamic`만)는 마운트 즉시 받아 오히려 늘었다(청크 분리 비용). "언제 마운트하나"까지 바꿔야 효과가 있었다.
- 남은 경고: unused-javascript 약 46 KB(Next 런타임), legacy-javascript 약 14 KB.

## 2. 달리기·카메라 중 레이아웃·스타일 재계산 (2026-11-10)

측정: `npm run build && node scripts/measure-run.mjs` — Playwright 크로미움 + CDP `Performance.getMetrics`, **CPU 4배 느리게**.
인트로를 건너뛴 뒤 ① → 를 3초 누르고 있기, ② 메뉴로 EDUCATION까지 자동 이동(3초 창, 도착해 창이 열리는 것 포함).

| 조건 | 구간 | 전: Layout | 후: Layout | Recalc Style | 메인 스레드 작업 | fps |
|---|---|---|---|---|---|---|
| PC 1280×720 | → 3초 | 52 | **1** | 180 | 296 ms | 60 |
| PC 1280×720 | 메뉴 자동 이동 | 39 | 10 | 150 | 407 ms | 59 |
| 모바일 390×844 | → 3초 | 1 | 1 | 182 | 227 ms | 60 |
| 모바일 390×844 | 메뉴 자동 이동 | 10 | 11 | 151 | 405 ms | 59 |

- **PC만 Layout 52회였던 원인**: 미니맵의 러너 점·화면 네모를 SVG `rect`의 `x·y` 속성으로 틱마다 바꾸고 있었다(SVG 속성 변경 = SVG 레이아웃).
  HTML 요소의 `transform`으로 바꾸자 1회. 모바일은 미니맵이 없어 처음부터 1회였다.
- 남은 Layout 1회: 첫 입력에 인사 말풍선이 사라지는 순간(DOM 제거). 메뉴 이동의 10회는 도착해 창이 열릴 때(창 마운트).
- **Recalc Style은 0이 아니다(틱당 약 1회 + 스프라이트 애니메이션)**: 위치를 인라인 `transform`으로 쓰면 스타일 재계산은 피할 수 없다.
  레이아웃·페인트로 번지지 않는 가벼운 재계산이다. "0회" 목표는 Layout 기준으로 지켰고, Style까지 0으로 만들려면 CSS 애니메이션으로 이동을 옮겨야 한다(틱 기반 설계와 충돌, 보류).
