# 마일스톤 기록

step마다 배포 주소에서 E2E·Lighthouse를 돌리고 여기에 남긴다(CLAUDE.md 5-2).

## step1 (진행 중)

| 날짜 | 내용 | 결과 |
|---|---|---|
| 2026-11-10 | 로컬 프로덕션 빌드 E2E(크로미움, 1280×720) | 8/8 통과: 키보드로 달려가 Enter, 메뉴 자동 이동 후 창, 첫 방문 SKIP → 메뉴 → 창 → ESC, 키보드만으로 6개 창, ABOUT 탭, axe 위반 0(트랙·창), 재방문 인사, reduced-motion |
| 2026-11-10 | 단위 테스트 | 141 통과(trackPath·useRunner 포함) |
| 2026-11-10 | E2E 3환경(크로미움 PC·모바일, WebKit PC) | 24 통과(6 건너뜀: 기기별 시나리오), 3회 연속 |
| 2026-11-10 | Lighthouse 모바일(로컬, devtools 스로틀링) | 성능 0.92 · 접근성 1.00 · 권장 사항 1.00 · SEO 1.00, 첫 화면 JS 146.9 KB |
| 2026-11-10 | Vercel 배포 https://portfolio2026fixel.vercel.app (커밋 3b29f14) | 배포 주소 E2E 26 통과(크로미움 PC·모바일, WebKit PC), Lighthouse 모바일 0.93 · PC 0.91 · 접근성 1.00 · 첫 화면 JS 148.9 KB |
| 2026-11-10 | GitHub Actions CI | lint·typecheck·unit·build·E2E·Lighthouse 통과 |
| 2026-11-10 | 화면 비교 테스트(PC·모바일 3장씩) | 기준 스크린샷은 리눅스 CI 수동 워크플로로 생성(Update visual snapshots), 이후 CI가 자동 비교 |
