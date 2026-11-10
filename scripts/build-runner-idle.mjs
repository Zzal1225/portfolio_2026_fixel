// 숨쉬기 idle 2프레임 × 방향 4줄을 러너 시트에서 만든다 → public/sprites/character/runner-idle-64x192.png
//
// 왜 스크립트로: idle 그림이 시안에 없다(11-10 사용자 결정: Claude가 만든다). 새로 그리면 팔레트·비율이 어긋나기 쉬워서,
// 지금 서 있을 때 쓰는 칸(달리기 시트 1번 열)을 그대로 프레임 0으로 쓰고, 프레임 1은 그 칸을 변형해 만든다.
//
// 프레임 1 규칙("어깨가 내려앉는" 숨쉬기): 머리부터 어깨선(티셔츠 색이 처음 나오는 행)까지를 1px 아래로 내리고,
// 바로 아래 가슴 한 줄을 덮는다. 몸통 아래(허리띠·반바지)와 다리·신발은 그대로 → 발이 바닥에서 뜨지 않는다.
// 버린 대안: 몸통 전체를 1px 내리기 — 셔츠 밑단이 반바지 허리띠 줄을 덮어 허리선이 사라진다.
//
// 결과는 원본과 같은 색만 쓰는지(16색 유지) 검사한다. 실행: node scripts/build-runner-idle.mjs
import { readPng, scaleUp, writePng } from './png.mjs';

const SHEET = 'public/sprites/character/runner-sheet-128x240.png';
const OUT = 'public/sprites/character/runner-idle-64x192.png';
const CELL_W = 32;
const CELL_H = 48;
const STAND_COL = 1; // 서 있을 때 쓰는 열(sprites.css의 background-position-x: -32px)
const TEE = [0x2e, 0x9b, 0xe0];

const src = readPng(SHEET);
const out = { w: CELL_W * 2, h: CELL_H * 4, data: new Uint8Array(CELL_W * 2 * CELL_H * 4 * 4) };

const at = (img, x, y) => {
  const i = (y * img.w + x) * 4;
  return img.data.subarray(i, i + 4);
};
const put = (img, x, y, px) => img.data.set(px, (y * img.w + x) * 4);

for (let row = 0; row < 4; row++) {
  const cell = [];
  for (let y = 0; y < CELL_H; y++) {
    const line = [];
    for (let x = 0; x < CELL_W; x++)
      line.push(Uint8Array.from(at(src, STAND_COL * CELL_W + x, row * CELL_H + y)));
    cell.push(line);
  }
  // 어깨선 = 티셔츠 색이 처음 나오는 행
  const shoulder = cell.findIndex((line) =>
    line.some((p) => p[3] > 0 && p[0] === TEE[0] && p[1] === TEE[1] && p[2] === TEE[2]),
  );
  if (shoulder < 0) throw new Error(`row ${row}: 어깨선을 못 찾음`);

  for (let y = 0; y < CELL_H; y++)
    for (let x = 0; x < CELL_W; x++) {
      // 프레임 0: 원본 그대로
      put(out, x, row * CELL_H + y, cell[y][x]);
      // 프레임 1: y ≤ shoulder+1 구간은 한 줄 위 픽셀(= 1px 내려온 모습), 그 아래는 원본
      let px;
      if (y === 0)
        px = new Uint8Array(4); // 맨 위는 빈 줄
      else if (y <= shoulder + 1) px = cell[y - 1][x];
      else px = cell[y][x];
      put(out, CELL_W + x, row * CELL_H + y, px);
    }
  console.log(`row ${row}: 어깨선 y=${shoulder}, ${shoulder + 1}행을 덮음`);
}

// 팔레트 검사: 원본 시트에 없는 색이 생기면 안 된다
const key = (p) => `${p[0]},${p[1]},${p[2]}`;
const srcColors = new Set();
for (let i = 0; i < src.data.length; i += 4)
  if (src.data[i + 3]) srcColors.add(key(src.data.subarray(i)));
for (let i = 0; i < out.data.length; i += 4)
  if (out.data[i + 3] && !srcColors.has(key(out.data.subarray(i)))) throw new Error('새 색이 생김');

writePng(OUT, out);
if (process.argv[2]) writePng(process.argv[2], scaleUp(out, 6)); // 확인용 6배 미리보기
console.log(`${OUT} 저장, 색 ${srcColors.size}개 유지`);
