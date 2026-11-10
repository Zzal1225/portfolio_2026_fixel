// 1회용 추출 스크립트: Design 시안 코드(track-kit-v2/v3)가 실행 시 해시로 계산하던 소품 배치를
// 그대로 돌려서 좌표만 출력한다. 결과는 src/features/track/layout.ts에 상수로 옮겨 적는다.
//
// 왜 런타임에 계산하지 않나: 결과가 고정인데 매번 640×360 픽셀을 훑을 이유가 없고,
// 상수여야 "소품은 구조물 반경 2칸 밖" 규칙을 단위 테스트로 보증할 수 있다.
// 시안 코드는 옮기지 않는다(CLAUDE.md 2장). 이 스크립트는 Node vm 샌드박스에서 실행만 한다.
//
// 실행: node scripts/extract-design-layout.mjs
import fs from 'node:fs';
import vm from 'node:vm';

const dir = new URL('../design/design_handoff_track_portfolio/prototype/', import.meta.url);
const sandbox = { window: {}, console };
vm.createContext(sandbox);
for (const f of ['track-kit-v2.js', 'track-kit-v3.js']) {
  vm.runInContext(fs.readFileSync(new URL(f, dir), 'utf8'), sandbox, { filename: f });
}
const K = sandbox.window.buildKit3();
const out = {
  props: K.PLACED.map((p) => ({ kind: p.id, x: p.x0, y: p.y0 })),
  items: K.ITEMS,
  len: K.LEN,
};
console.log(JSON.stringify(out, null, 1));
