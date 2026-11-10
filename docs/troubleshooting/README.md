# 트러블슈팅

원인이 예상과 달랐던 문제만 골랐다. 각 문서는 **문제 → 원인 → 해결 → 결과** 순서이고, 수치는 [performance.md](../performance.md)에 측정 조건과 함께 있다.

| # | 문제 | 한 줄 원인 | 결과 |
|---|---|---|---|
| 1 | [달리기 중 PC만 레이아웃 재계산 52회](01-minimap-svg-layout.md) | 미니맵 SVG `rect`의 x·y 속성을 틱마다 바꿈 | 52 → 1회 |
| 2 | [인트로 큰 전광판이 매 프레임 레이아웃](02-intro-board-transform.md) | left·top·width·height 애니메이션 | 인트로 전체 103 → 44회 |
| 3 | [첫 화면 LCP 2.6초, JS 예산 초과](03-first-screen-loading.md) | 한글 폰트가 LCP 그림과 다운로드 경쟁 / `dynamic`만으로는 JS가 안 줄어듦 | LCP 1.5초, JS 164.9 → 146.9 KB |
| 4 | [WebKit에서만 가끔 SKIP이 안 눌림](04-skip-before-hydration.md) | 하이드레이션 전 서버 HTML의 버튼을 누름 | 'boot' 단계 추가, 3회 연속 통과 |
| 5 | [CI가 10분 넘게 멈춤](05-ci-install-stall.md) | 브라우저 설치 중 리눅스 패키지 내려받기 멈춤(재시도로도 불안정) | Playwright 공식 이미지로 설치 제거, CI 3분 28초 |
