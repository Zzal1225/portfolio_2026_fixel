// 작은 그림들을 시트 3장으로 합친다(기획서 step3 "시트 합치기", 전후 측정은 docs/performance.md 4장).
//
// 왜: 첫 화면이 구조물·신호등·심판·이정표 PNG를 하나씩(10개 넘게) 따로 받았다. 시트 하나면 요청 1개.
// 합치지 않는 것: 타일(background-repeat로 반복해야 함), 트랙 고리·지도 그림(크고 단독으로 쓰임),
//                러너·소품·관중(이미 시트), 말풍선 조각(border-image는 파일 하나를 통째로 씀),
//                전광판 빈 그림(인트로 큰 전광판이 background-size 100%로 늘려 씀 — 시트면 이웃 그림까지 늘어남).
// 선택 외곽선(-selected)은 따로 한 장: 처음 선택될 때만 받던 지연 로드를 유지한다.
//
// 좌표는 sprites.css의 생성 블록(@generated sheets)에 CSS 변수로만 쓴다(CLAUDE.md: 시트 좌표는 sprites.css에만).
// 실행: node scripts/build-sheets.mjs
import fs from 'node:fs';
import { readPng, writePng } from './png.mjs';

const SRC = 'design/design_handoff_track_portfolio/assets';
const OUT = 'public/sprites/sheets';

const SHEETS = {
  objects: [
    ['arch-96x64', 'structures/arch-96x64.png'],
    ['scoreboard-96x32', 'structures/scoreboard-blank-96x32.png'],
    ['water-a-64x32', 'structures/water-a-64x32.png'],
    ['water-b-64x32', 'structures/water-b-64x32.png'],
    ['tent-64x64', 'structures/tent-64x64.png'],
    ['reception-table-64x32', 'structures/reception-table-64x32.png'],
    ['signpost-48x50', 'structures/signpost-48x50.png'],
    ['signal-off', 'intro/signal-off-32x64.png'],
    ['signal-red', 'intro/signal-red-32x64.png'],
    ['signal-yellow', 'intro/signal-yellow-32x64.png'],
    ['signal-green', 'intro/signal-green-32x64.png'],
    ['referee-up', 'intro/referee-flag-up-32x48.png'],
    ['referee-down', 'intro/referee-flag-down-32x48.png'],
  ],
  selected: [
    ['arch-96x64-selected', 'structures/arch-96x64-selected.png'],
    ['scoreboard-96x32-selected', 'structures/scoreboard-96x32-selected.png'],
    ['water-a-64x32-selected', 'structures/water-a-64x32-selected.png'],
    ['water-b-64x32-selected', 'structures/water-b-64x32-selected.png'],
    ['tent-64x64-selected', 'structures/tent-64x64-selected.png'],
    ['reception-table-64x32-selected', 'structures/reception-table-64x32-selected.png'],
  ],
  ui: [
    ['alert-1', 'ui/alert-bubble-1-16x16.png'],
    ['alert-2', 'ui/alert-bubble-2-16x16.png'],
    ['keycap-up', 'ui/keycap-up-16x16.png'],
    ['keycap-down', 'ui/keycap-down-16x16.png'],
  ],
};

/** 선반(shelf) 배치: 큰 것부터 한 줄씩 채운다. 폭 256 고정. 그림 사이 1px 띄워 이웃 번짐 방지 */
function pack(items, maxW = 256) {
  const sorted = [...items].sort((a, b) => b.img.h - a.img.h || b.img.w - a.img.w);
  let x = 0,
    y = 0,
    rowH = 0,
    w = 0;
  for (const it of sorted) {
    if (x + it.img.w > maxW) {
      x = 0;
      y += rowH + 1;
      rowH = 0;
    }
    it.x = x;
    it.y = y;
    x += it.img.w + 1;
    rowH = Math.max(rowH, it.img.h);
    w = Math.max(w, x - 1);
  }
  return { w, h: y + rowH };
}

fs.mkdirSync(OUT, { recursive: true });
const vars = [];
for (const [sheet, list] of Object.entries(SHEETS)) {
  const items = list.map(([name, file]) => ({ name, img: readPng(`${SRC}/${file}`) }));
  const { w, h } = pack(items);
  const data = new Uint8Array(w * h * 4);
  for (const it of items)
    for (let yy = 0; yy < it.img.h; yy++)
      for (let xx = 0; xx < it.img.w; xx++) {
        const s = (yy * it.img.w + xx) * 4;
        data.set(it.img.data.subarray(s, s + 4), ((it.y + yy) * w + (it.x + xx)) * 4);
      }
  const file = `${sheet}-${w}x${h}.png`;
  writePng(`${OUT}/${file}`, { w, h, data });
  vars.push(`  --sheet-${sheet}: url('/sprites/sheets/${file}');`);
  for (const it of items) vars.push(`  --pos-${it.name}: ${-it.x}px ${-it.y}px;`);
  console.log(`${file}: ${items.length}장`);
}

const START = '/* @generated sheets start — scripts/build-sheets.mjs가 쓴다. 직접 고치지 않는다 */';
const END = '/* @generated sheets end */';
const block = `${START}\n:root {\n${vars.join('\n')}\n}\n${END}`;
const cssPath = 'src/styles/sprites.css';
let css = fs.readFileSync(cssPath, 'utf8');
css = css.includes(START)
  ? css.replace(
      new RegExp(
        `${START.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`,
      ),
      block,
    )
  : `${block}\n\n${css}`;
fs.writeFileSync(cssPath, css);
console.log('sprites.css 생성 블록 갱신');
