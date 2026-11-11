# 그림·폰트 출처와 라이선스

그림·폰트를 추가하거나 바꾸면 이 표를 같이 고친다(CLAUDE.md 2장).

## 폰트 (전부 SIL Open Font License 1.1, `src/app/fonts/licenses/`에 원문)

| 파일 | 폰트 | 출처 | 쓰는 곳 |
|---|---|---|---|
| PressStart2P-Regular.woff2 | Press Start 2P (CodeMan38) | npm `@fontsource/press-start-2p@5.3.0` latin 400 | 영어 라벨·HUD·창 제목 |
| Galmuri11-Bold.woff2 | Galmuri11 Bold (이민서) | npm `galmuri@2.40.3` | 전광판 문구·이정표·섹션 제목 |
| Pretendard-Regular/Bold.subset.woff2 | Pretendard (길형진) KS X 1001 2,350자 서브셋 | npm `pretendard@1.3.9` static/woff2-subset | 창 본문 |

## 그림

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `public/sprites/{tiles,structures,props,ui,character,intro}/*.png` (32장) | Claude Design 시안(`design/design_handoff_track_portfolio/assets`)에서 그대로 복사(11-10) | 본인 제작물(Claude Design으로 생성) |
| `public/sprites/ui/nine-{white,tee}-24.svg` | 시안 9-slice 테두리(프로토타입 HTML의 SVG)를 파일로 옮김 | 본인 제작물 |
| `public/sprites/character/runner-idle-64x192.png` | 러너 시트의 서 있는 칸을 `scripts/build-runner-idle.mjs`로 변형(머리·어깨 1px 아래, 11-10) | 본인 제작물 |
| `public/sprites/props/spectators-64x32.png`, `public/sprites/world/world-map-640x360.png` | Claude Design 시안 PNG 그대로(11-10) | 본인 제작물 |
| `public/sprites/ui/speech-body-24x14.png`, `speech-tail-6x3.png` | 시안 speech-plate를 `scripts/build-speech-bubble.mjs`로 나눔 | 본인 제작물 |
| `public/sprites/ui/alert-body-14x11.png`, `alert-tail-5x3.png` | 시안 "!" 말풍선을 `scripts/build-alert-bubble.mjs`로 나눔("!" 지움, 11-10 6차) | 본인 제작물 |
| `public/sprites/world/track-ring-512x232.png` | 시안 생성 코드(track-kit)를 `scripts/build-track-ring.mjs`로 실행해 레인 띠만 추출 | 본인 제작물 |
| `public/sprites/sheets/*.png` (물건·선택 외곽선·UI(키캡) 시트 3장) | 위 시안 PNG들을 `scripts/build-sheets.mjs`로 합침(11-10). 개별 PNG는 삭제 | 본인 제작물 |
| `public/img/about-me-{320,640}.webp` | 본인 사진(원본 `private/img/`, gitignore)을 `scripts/build-photos.mjs`로 줄임(WebP, EXIF 제거, 11-10) | 본인 사진 |
| `public/sprites/ui/cursor-hand-32x32.png` | 사이트 팔레트로 새로 그림(16×16 격자, `scripts/build-cursor.mjs`, 11-11) | 본인 제작물 |
| `src/app/opengraph-image.png`, `icon.png`, `apple-icon.png` | 시안 월드 전경·러너 시트·흰 9-slice 판 + Press Start 2P로 `scripts/build-og.mjs`가 구움(11-10) | 본인 제작물 |
