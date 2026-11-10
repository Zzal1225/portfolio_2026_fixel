# 박찬령 포트폴리오 — 400m 트랙

**https://portfolio2026fixel.vercel.app**

> README 맨 위 15초 GIF(신호등 → 한 바퀴 → 메뉴 클릭 → 창)는 배포 후 추가한다.

도트 그림 육상 트랙 위를 캐릭터가 달리는 1인 포트폴리오입니다. 트랙 위 구조물 6개 앞에 서거나 메뉴·미니맵을 누르면
ABOUT ME · CAREER · PROJECT1 · PROJECT2 · SKILL · RESUME 창이 열립니다. 들어오면 출발 신호등과 함께 약 14초짜리 인트로가 재생됩니다(SKIP·아무 키로 건너뛰기).

## 무엇을 증명하나

게임 엔진·캔버스 없이 **React + CSS만으로** 트랙 위 이동, 카메라, 최단 방향 계산, 스프라이트 애니메이션을 직접 구현하면서
접근성과 성능을 지킨 것.

| 항목 | 구현 | 근거 |
|---|---|---|
| 트랙 위 이동 | 위치는 `t`(0~1) 하나. 스타디움 트랙(직선 2 + 반원 2)을 닫힌 식으로 풀어 좌표·접선 계산 | `src/features/track/trackPath.ts` |
| 네 방향 키 → 트랙 방향 | 키 벡터와 접선의 내적으로 시계/반시계 결정, 같은 키를 누르는 동안 방향 잠금 | `useRunner.ts` `stepRunner` |
| 카메라 | 월드 컨테이너 하나의 `transform`. 가운데 40% 여유 구간, 월드 경계 클램프, 정수 좌표 × 정수 배율 | `World.tsx`, `cameraTarget` |
| 루프 | `requestAnimationFrame` 없이 60 ms 고정 틱 + CSS transition 보간 | `runner-config.ts` |
| 인트로 | "경과 ms → 화면" 순수 함수 시간표 + 고정 틱 진행기. 정수 줌(2→3→4), 부채꼴 흑백→컬러 | `src/features/intro/` |
| 접근성 | 글·버튼은 전부 DOM, 구조물·메뉴·지도 점은 `<button>`, Radix Dialog, 키보드만으로 6개 창, reduced-motion | E2E + axe 위반 0 |
| 성능 | 배포 주소 Lighthouse 모바일 0.93 · PC 0.91 · 접근성 1.00, 첫 화면 JS 148.9 KB, 달리기 중 Layout 1회 | `docs/performance.md` |

## 실행

```bash
npm install
npm run dev            # http://localhost:3000
npm run check          # lint + typecheck + 단위 테스트
npm run build && npm run test:e2e   # Playwright(크로미움 PC·모바일, WebKit PC) + axe
E2E_BASE_URL=https://portfolio2026fixel.vercel.app npx playwright test   # 배포 주소 대상
```

- 단위 테스트(Vitest): 트랙 경로·최단 방향·반응 구역·카메라 경계·상태 머신·인트로 시간표·배율·배치 규칙.
- 측정 스크립트: `scripts/lh-summary.mjs`(Lighthouse 요약), `scripts/measure-run.mjs`(달리기 중 레이아웃 횟수).

## 기술 스택

Next.js 16(App Router) · TypeScript(strict) · Tailwind CSS 4 · Zustand · Radix UI(Dialog·Tabs) · Vitest · Playwright · axe · Lighthouse CI · GitHub Actions

## 문서

- `docs/기획서.md` — 기획(화면·기능 범위·측정 항목)
- `docs/design-vs-plan.md` — 디자인 시안과 기획의 차이, 결정 기록
- `docs/performance.md` — 성능 측정 전후
- `docs/troubleshooting/` — 원인이 예상과 달랐던 문제 5건(문제 → 원인 → 해결 → 결과)
- `docs/assets/credits.md` — 그림·폰트 출처와 라이선스

---

그림: Claude Design 시안 + 직접 수정 · 폰트: Press Start 2P, Galmuri, Pretendard (SIL OFL 1.1)
