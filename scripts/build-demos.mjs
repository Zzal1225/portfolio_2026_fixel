// 프로젝트 창 "주요 기능"의 시연 GIF를 웹용으로 굽는다. 원본은 private/img/demos/(gitignore) → public/img/*.webp.
//
// 왜: 폰 화면 녹화 GIF 4개가 합쳐 5.6MB였다. GIF는 256색 + 프레임 간 압축이 약해 같은 화면이 animated WebP보다 몇 배 크다.
//     창을 열고 스크롤하는 사람에게 그만큼 받게 할 이유가 없다.
// 한 개마다 두 장을 만든다:
//   {name}.webp        움직이는 그림(원본 크기 420×850 그대로: 표시 폭 200px의 2배 화면용)
//   {name}-still.webp  멈춘 한 장. prefers-reduced-motion 사용자는 이것만 받는다(Sections.tsx Features의 <picture>)
// still: 멈춘 그림으로 쓸 프레임(0~1, 전체 길이 중 위치). 첫 프레임은 대개 기능이 드러나기 전이라 항목마다 고른다.
// 실행: node scripts/build-demos.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const SRC = 'private/img/demos';
const OUT = 'public/img';
const DEMOS = [
  { name: 'nanaki-offline-sync', src: '01-offline-sync.gif', still: 0.36 },
  { name: 'nanaki-naki-ai', src: '02-naki-ai.gif', still: 1 },
  { name: 'nanaki-schema-form', src: '03-schema-form.gif', still: 0.5 },
  { name: 'nanaki-dark-mode', src: '04-dark-mode.gif', still: 1 },
];

fs.mkdirSync(OUT, { recursive: true });
for (const d of DEMOS) {
  const src = `${SRC}/${d.src}`;
  const meta = await sharp(src, { animated: true }).metadata();
  const frames = meta.pages ?? 1;
  const anim = await sharp(src, { animated: true })
    .webp({ quality: 70, effort: 6 })
    .toFile(`${OUT}/${d.name}.webp`);
  const page = Math.min(frames - 1, Math.round((frames - 1) * d.still));
  const still = await sharp(src, { page })
    .webp({ quality: 80 })
    .toFile(`${OUT}/${d.name}-still.webp`);
  const before = fs.statSync(src).size;
  console.log(
    `${d.name}: ${meta.width}×${meta.pageHeight ?? meta.height}, ${frames}프레임, ` +
      `${(before / 1024).toFixed(0)}KB → ${(anim.size / 1024).toFixed(0)}KB (멈춘 그림 ${(still.size / 1024).toFixed(1)}KB, 프레임 ${page})`,
  );
}
