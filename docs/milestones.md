# 마일스톤 기록

step마다 배포 주소에서 E2E·Lighthouse를 돌리고 여기에 남긴다(CLAUDE.md 5-2).

## step1 (진행 중)

| 날짜 | 내용 | 결과 |
|---|---|---|
| 2026-11-10 | 로컬 프로덕션 빌드 E2E(크로미움, 1280×720) | 8/8 통과: 키보드로 달려가 Enter, 메뉴 자동 이동 후 창, 첫 방문 SKIP → 메뉴 → 창 → ESC, 키보드만으로 6개 창, ABOUT 탭, axe 위반 0(트랙·창), 재방문 인사, reduced-motion |
| 2026-11-10 | 단위 테스트 | 141 통과(trackPath·useRunner 포함) |
| – | Vercel 배포 | 아직(저장소 원격·Vercel 연결 필요) |
