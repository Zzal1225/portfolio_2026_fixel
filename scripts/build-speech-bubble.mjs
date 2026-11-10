// 인사 말풍선 그림을 시안 판(speech-plate-24x18.png)에서 두 조각으로 나눈다(시안 프로토타입과 같은 방식).
//  - 몸통 24×14: 위 14줄 + 맨 아래 줄 가운데를 테두리색(metal)으로 막음 → 9-slice(slice 4)로 글 길이에 맞춰 늘림
//  - 꼬리 6×3: 13~15행, 9~14열 → 몸통 아래 가운데에 붙임
// 왜 나누나: 판 하나를 통째로 늘리면 꼬리까지 늘어난다. 실행: node scripts/build-speech-bubble.mjs
import { readPng, writePng } from './png.mjs';

const src = readPng('public/sprites/ui/speech-plate-24x18.png');
const crop = (x0, y0, w, h) => {
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = ((y0 + y) * src.w + (x0 + x)) * 4;
      data.set(src.data.subarray(i, i + 4), (y * w + x) * 4);
    }
  return { w, h, data };
};

const body = crop(0, 0, 24, 14);
// 맨 아래 줄 2~21열을 테두리색으로(원본은 그 자리가 꼬리로 이어지는 흰색)
const edge = src.data.subarray((0 * src.w + 2) * 4, (0 * src.w + 2) * 4 + 4); // 윗줄 테두리 픽셀 색
for (let x = 2; x <= 21; x++) body.data.set(edge, (13 * 24 + x) * 4);

writePng('public/sprites/ui/speech-body-24x14.png', body);
writePng('public/sprites/ui/speech-tail-6x3.png', crop(9, 13, 6, 3));
console.log('speech-body-24x14.png, speech-tail-6x3.png');
