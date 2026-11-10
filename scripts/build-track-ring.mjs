// 트랙 고리(곡선 레인 띠)만 투명 PNG로 뽑는다. 11-10 결정(design-vs-plan #15).
//
// 왜 필요한가: 잔디·관중석·트랙 바닥은 32×32 타일 반복으로 되지만, 곡선 레인과 레인 선은 반복 무늬가 아니다.
// CSS border-radius로 그리면 곡선이 매끈하게 번져(안티앨리어싱) 계단식 픽셀 곡선인 시안과 달라진다.
// 그래서 "레인 띠 픽셀만" 담은 PNG 한 장을 만든다(띠 밖은 투명). 월드 전체 한 장이 아니므로
// CLAUDE.md의 "큰 PNG 한 장 금지" 취지(전체 배경을 한 장으로 때우지 않기)는 지킨다.
//
// 방법: Design 시안 코드(track-kit-v2/v3)를 Node vm에서 실행해 월드 격자(BG)를 받고,
// 트랙 띠(band) 안 픽셀만 16색 팔레트 RGBA로 옮겨 PNG로 인코딩한다(외부 라이브러리 없이 zlib만).
// 시안 코드는 저장소 앱 코드로 옮기지 않는다. 이 스크립트는 그림을 "굽는" 도구다.
//
// 실행: node scripts/build-track-ring.mjs   → public/sprites/world/track-ring-512x232.png
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';

const dir = new URL('../design/design_handoff_track_portfolio/prototype/', import.meta.url);
const sandbox = { window: {}, console };
vm.createContext(sandbox);
for (const f of ['track-kit-v2.js', 'track-kit-v3.js']) {
  vm.runInContext(fs.readFileSync(new URL(f, dir), 'utf8'), sandbox, { filename: f });
}
const K = sandbox.window.buildKit3();
const { g, band } = K.BG;

// 띠의 바운딩 박스(월드 좌표). 스타디움 바깥 반지름 116 → x 64..575, y 64..295
let x0 = Infinity,
  y0 = Infinity,
  x1 = -1,
  y1 = -1;
for (let y = 0; y < K.H; y++)
  for (let x = 0; x < K.W; x++)
    if (band[y][x]) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
const w = x1 - x0 + 1;
const h = y1 - y0 + 1;

const hex = (code) => {
  const name = K.CH[code];
  const c = name && K.PAL16[name];
  if (!c) throw new Error(`팔레트에 없는 픽셀 코드: ${code}`);
  return [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
};

// PNG 원본 데이터: 줄마다 필터 바이트 0 + RGBA
const raw = Buffer.alloc((w * 4 + 1) * h);
for (let y = 0; y < h; y++) {
  raw[y * (w * 4 + 1)] = 0;
  for (let x = 0; x < w; x++) {
    const wx = x0 + x,
      wy = y0 + y;
    if (!band[wy][wx]) continue; // 띠 밖 = 투명(0,0,0,0)
    const [r, gg, b] = hex(g.p[wy][wx]);
    const o = y * (w * 4 + 1) + 1 + x * 4;
    raw[o] = r;
    raw[o + 1] = gg;
    raw[o + 2] = b;
    raw[o + 3] = 255;
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0);
ihdr.writeUInt32BE(h, 4);
ihdr[8] = 8;
ihdr[9] = 6; // 8bit RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const outDir = new URL('../public/sprites/world/', import.meta.url);
fs.mkdirSync(outDir, { recursive: true });
const name = `track-ring-${w}x${h}.png`;
fs.writeFileSync(new URL(name, outDir), png);
console.log(
  JSON.stringify({ file: name, origin: { x: x0, y: y0 }, size: { w, h }, bytes: png.length }),
);
