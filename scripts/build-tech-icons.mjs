// SKILLS 창의 기술 아이콘을 public/icons/tech/에 굽는다(11-12 사용자 결정: 실제 로고 사용).
//
// 출처: Devicon 2.18.0(MIT) "original" 그림. 사용자 시안의 아이콘이 이 여러 색 로고와 같다.
// (11-12: TanStack·GitHub Actions를 Docker·Vercel로 바꾸면서 Simple Icons에서 가져오던 TanStack이 빠져 출처가 하나가 됐다)
// 왜 라이브러리를 의존성에 넣지 않나: 필요한 건 그림 16개뿐이다. 패키지째 넣으면 설치만 커지고, 화면에는 이 파일들만 쓴다.
// 왜 Zustand만 PNG: Devicon의 곰 그림이 124KB 벡터라 18px 칸에 과하다. 2배(36px) PNG로 구우면 1~2KB.
//
// 실행(받은 패키지를 아무 폴더에 풀어 두고):
//   npm pack devicon@2.18.0 && tar -xzf devicon-2.18.0.tgz
//   node scripts/build-tech-icons.mjs <풀린 package 경로>
import { mkdir, readFile, copyFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const [devDir] = process.argv.slice(2);
if (!devDir) {
  console.error('사용법: node scripts/build-tech-icons.mjs <devicon package>');
  process.exit(1);
}
const OUT = 'public/icons/tech';
await mkdir(OUT, { recursive: true });

/** 결과 파일 이름 = content/panels.ts의 icon 값 */
const DEVICON = [
  'html5',
  'css3',
  'javascript',
  'jquery',
  'php',
  'react',
  'nextjs',
  'typescript',
  'tailwindcss',
  'supabase',
  'playwright',
  'vitest',
  'docker',
  'vercel',
  'claudecode',
  'githubactions',
];
for (const n of DEVICON) {
  await copyFile(path.join(devDir, 'icons', n, `${n}-original.svg`), path.join(OUT, `${n}.svg`));
}

const zustand = await readFile(path.join(devDir, 'icons', 'zustand', 'zustand-original.svg'));
await sharp(zustand, { density: 72 })
  .resize(36, 36, { fit: 'contain', background: '#0000' })
  .png()
  .toFile(path.join(OUT, 'zustand.png'));

console.log('ok');
