// 1회용 추출 스크립트: Design 시안 코드(track-kit-v2/v3)가 실행 시 해시로 계산하던 배치를 그대로 돌려 숫자만 뽑는다.
//
// 왜 런타임에 계산하지 않나: 결과가 고정인데 매번 640×360 픽셀을 훑을 이유가 없고,
// 상수여야 배치 규칙(소품은 구조물 2칸 밖, 관중은 관중석 안 등)을 단위 테스트로 보증할 수 있다.
// 시안 코드는 앱으로 옮기지 않는다(CLAUDE.md 2장). 이 스크립트는 Node vm 샌드박스에서 실행만 한다.
//
// 실행:
//   node scripts/extract-design-layout.mjs          → 소품·구조물·둘레를 화면에 출력(layout.ts에 손으로 옮긴 값의 출처)
//   node scripts/extract-design-layout.mjs --write  → src/features/track/layout-stands.ts 생성(관중·잔디 디테일)
import fs from 'node:fs';
import vm from 'node:vm';

const dir = new URL('../design/design_handoff_track_portfolio/prototype/', import.meta.url);
const sandbox = { window: {}, console };
vm.createContext(sandbox);
for (const f of ['track-kit-v2.js', 'track-kit-v3.js']) {
  vm.runInContext(fs.readFileSync(new URL(f, dir), 'utf8'), sandbox, { filename: f });
}
const K = sandbox.window.buildKit3();

if (!process.argv.includes('--write')) {
  const out = {
    props: K.PLACED.map((p) => ({ kind: p.id, x: p.x0, y: p.y0 })),
    items: K.ITEMS,
    len: K.LEN,
  };
  console.log(JSON.stringify(out, null, 1));
  process.exit(0);
}

// 관중: 16×16, 종류(옷 색) 0~3, 시작 프레임 0/1
const spectators = K.SPECTS.map((s) => [s.x, s.y, s.kind, s.phase]);

// 잔디 디테일: 월드 격자에서 잔디 위 어두운 픽셀(관중석 경계선·잔디 점)을 사각형으로 합친다(픽셀 1186개 → 사각형 수십 개)
const g = K.BG.g;
const on = Array.from({ length: K.H }, (_, y) =>
  Array.from(
    { length: K.W },
    (_, x) => g.p[y][x] === 'D' && !K.BG.band[y][x] && !K.isStandAt(x, y),
  ),
);
const used = on.map((r) => r.map(() => false));
const rects = [];
for (let y = 0; y < K.H; y++)
  for (let x = 0; x < K.W; x++) {
    if (!on[y][x] || used[y][x]) continue;
    let w = 0;
    while (x + w < K.W && on[y][x + w] && !used[y][x + w]) w++;
    let h = 1;
    grow: while (y + h < K.H) {
      for (let i = 0; i < w; i++) if (!on[y + h][x + i] || used[y + h][x + i]) break grow;
      h++;
    }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) used[y + j][x + i] = true;
    rects.push([x, y, w, h]);
  }

const ts = `/**
 * 생성 파일 — 직접 고치지 않는다. \`node scripts/extract-design-layout.mjs --write\`로 다시 만든다.
 * 출처: Design 시안 track-kit-v3.js의 SPECTS(관중 해시 배치)와 월드 격자의 잔디 어두운 픽셀.
 */

/** 관중 [x, y, 종류(옷 색 0~3), 시작 프레임 0|1]. 16×16, 관중석 안에만 */
export const SPECTATORS: readonly (readonly [number, number, number, 0 | 1])[] = ${JSON.stringify(spectators)};

/** 잔디 디테일 [x, y, w, h]: 관중석 아래·옆 1px 그림자 선과 잔디 점(grassDark) */
export const GRASS_DETAILS: readonly (readonly [number, number, number, number])[] = ${JSON.stringify(rects)};
`;
fs.writeFileSync(new URL('../src/features/track/layout-stands.ts', import.meta.url), ts);
console.log(`관중 ${spectators.length}명, 잔디 디테일 사각형 ${rects.length}개 → layout-stands.ts`);
