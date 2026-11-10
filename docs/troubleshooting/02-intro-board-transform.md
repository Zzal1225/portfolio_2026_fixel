# 2. 인트로 큰 전광판이 매 프레임 레이아웃

## 문제
시안 인트로(14.3초)를 채택하면서 소수 배율 줌인·줌아웃이 생겨 프레임을 따로 쟀다(`scripts/measure-intro.mjs`, rAF로 모든 프레임 시각 기록).
fps는 CPU 4배에서도 56~60으로 괜찮았지만, **인트로 한 번에 Layout 103회**가 나왔다.

## 원인
줌(월드 컨테이너 transform)이 아니라 **큰 전광판**이었다. 전광판이 제자리에서 화면 가운데로 커질 때
`left`·`top`·`width`·`height`를 CSS transition으로 바꾸고 있어, 커지고 작아지는 동안 매 프레임 레이아웃이 일어났다.
fps가 멀쩡해서 지나칠 뻔했다. 저사양 기기나 다른 작업이 겹치면 그대로 프레임 저하가 된다.

## 해결
전광판을 처음부터 **큰 크기로 고정**하고, 작은 모습은 `transform: translate3d(x, y, 0) scale(s)`(`transform-origin: 0 0`)로 만들었다.
위치·크기 변화가 전부 transform 하나의 transition이 된다(`src/features/intro/IntroOverlay.tsx` BigBoard).

## 결과
| 조건 | 전 Layout | 후 Layout |
|---|---|---|
| PC, CPU 4× | 103 | **44** |
| 모바일, CPU 4× | 105 | **46** |

남은 44회는 신호 띠·문구·HUD·키캡이 나타나고 사라지는 순간(DOM 추가·제거)이라 연출상 필요하다.
배운 것: fps만 보면 문제가 숨는다. Layout 횟수를 같이 재야 "지금은 괜찮지만 위험한" 코드를 찾는다.
