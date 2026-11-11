// 창에 넣는 사진을 웹용으로 줄인다. 원본은 private/img/(gitignore, 수 MB) → public/img/*.webp.
//
// 왜: 휴대폰 원본(3442×4590, 2.2MB)을 그대로 두면 창을 여는 순간 그만큼 받는다. 창 안 표시 폭은 최대 280px이라
//     1배(320w)·2배(640w) 두 장이면 충분하고, 브라우저가 srcset으로 화면 밀도에 맞는 것만 받는다.
// 왜 next/image가 아닌가: 문구·경로는 content/에 문자열로 두는 규칙이라 정적 import가 맞지 않고,
//     사진 한 장을 위해 런타임 이미지 최적화(서버리스 함수 호출)를 쓸 이유가 없다. 빌드 전에 한 번 굽는다.
// 함정: sharp는 기본으로 메타데이터(EXIF: 촬영 기기·위치)를 버린다 — 공개 사이트라 그게 맞다. rotate()로 방향만 먼저 반영.
// 실행: node scripts/build-photos.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const SRC = 'private/img';
const OUT = 'public/img';
// crop: 원본 픽셀 기준. ABOUT ME 사진 자리가 세로형(4:5)이라 가로 사진에서 기록판과 인물이 함께 들어오는 부분만 쓴다
const PHOTOS = [
  {
    src: 'about_me_01.jpg',
    name: 'about-me',
    crop: { left: 800, top: 0, width: 1476, height: 1845 },
  },
];
const WIDTHS = [320, 640];

fs.mkdirSync(OUT, { recursive: true });
for (const p of PHOTOS) {
  for (const w of WIDTHS) {
    const out = `${OUT}/${p.name}-${w}.webp`;
    const info = await sharp(`${SRC}/${p.src}`)
      .rotate()
      .extract(p.crop)
      .resize({ width: w })
      .webp({ quality: 80 })
      .toFile(out);
    console.log(`${out}: ${info.width}×${info.height}, ${(info.size / 1024).toFixed(1)}KB`);
  }
}
