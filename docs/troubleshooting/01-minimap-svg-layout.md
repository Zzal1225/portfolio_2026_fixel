# 1. 달리기 중 PC만 레이아웃 재계산 52회

## 문제
카메라·캐릭터는 `transform`만 쓰므로 달리는 동안 Layout이 0회여야 했다(CLAUDE.md 측정 목표).
`scripts/measure-run.mjs`(Playwright + CDP `Performance.getMetrics`, CPU 4배 느리게)로 → 키 3초를 재자 **PC는 Layout 52회, 모바일은 1회**였다.

## 원인
같은 코드에서 화면 크기만 다르면 결과가 갈렸다 → PC에만 있는 것을 의심했다. PC에만 미니맵이 있다.
미니맵의 러너 점과 "현재 화면" 네모를 SVG `<rect>`의 `x`·`y` **속성**으로 틱(60ms)마다 바꾸고 있었다.
SVG 기하 속성 변경은 transform이 아니라 SVG 레이아웃을 다시 계산하게 한다. 3초 ÷ 60ms ≈ 50회와 맞아떨어졌다.

## 해결
점과 네모를 SVG 밖 HTML `div`로 꺼내 `transform: translate3d()`로 움직였다(`src/features/hud/Minimap.tsx` RunnerDot·ViewRect).
트랙 모양 SVG는 정적이라 그대로 둔다.

## 결과
| 조건 | 전 | 후 |
|---|---|---|
| PC → 3초 Layout | 52 | **1** |
| PC 메뉴 자동 이동 Layout | 39 | 10(도착해 창이 열릴 때) |

배운 것: "transform만 쓴다"는 규칙은 메인 월드에만 지키기 쉽다. 같은 상태를 보여 주는 보조 UI(미니맵)가 규칙을 깬다. 측정을 화면 크기별로 나눠서 잡을 수 있었다.
