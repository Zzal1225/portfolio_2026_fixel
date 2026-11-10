// 반응 구역 말풍선을 시안 "!" 말풍선(alert-bubble-1-16x16.png)에서 두 조각으로 나눈다(11-10 6차 결정: 말풍선 안에 "!" 대신 SPACE).
//  - 몸통 14×11: 1~14열, 0~10행. 가운데 "!" 픽셀을 흰 바탕으로 지우고, 맨 아래 줄의 꼬리 자리(연회색)를 테두리색으로 막음
//    → 9-slice(slice 3)로 글자 길이만큼 가로로 늘림
//  - 꼬리 5×3: 10~12행, 5~9열 → 몸통 아래 가운데에 1px 겹쳐 붙임
// 왜 나누나: 16×16 판 안쪽은 12px뿐이라 "SPACE"가 들어가지 않고, 판을 통째로 늘리면 꼬리까지 늘어난다(인사 말풍선과 같은 이유).
// 시안 2번째 프레임은 같은 그림을 1px 아래로 내린 것이라 그림 대신 CSS transform으로 까딱인다(sprites.css .alert-bubble).
// 실행: node scripts/build-alert-bubble.mjs
import { readPng, writePng } from './png.mjs';

const src = readPng('design/design_handoff_track_portfolio/assets/ui/alert-bubble-1-16x16.png');
const px = (x, y) => src.data.subarray((y * src.w + x) * 4, (y * src.w + x) * 4 + 4);
const crop = (x0, y0, w, h) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) data.set(px(x0 + x, y0 + y), (y * w + x) * 4);
  return { w, h, data };
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];

const INK = px(7, 2); // "!" 색
const WHITE = px(2, 2); // 바탕
const EDGE = px(3, 0); // 테두리
const body = crop(1, 0, 14, 11);
for (let y = 0; y < body.h; y++)
  for (let x = 0; x < body.w; x++) {
    const i = (y * body.w + x) * 4;
    const c = body.data.subarray(i, i + 4);
    if (same(c, INK)) body.data.set(WHITE, i);
    // 맨 아래 줄: 꼬리로 이어지던 연회색을 테두리색으로(꼬리는 따로 붙임)
    if (y === 10 && c[3] && !same(c, EDGE)) body.data.set(EDGE, i);
  }

writePng('public/sprites/ui/alert-body-14x11.png', body);
writePng('public/sprites/ui/alert-tail-5x3.png', crop(5, 10, 5, 3));
console.log('alert-body-14x11.png, alert-tail-5x3.png');
