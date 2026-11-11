// 누를 수 있는 곳의 커서(러너의 손)를 굽는다. 16×16 격자를 정수 2배로 → public/sprites/ui/cursor-hand-32x32.png
//
// 왜 격자를 코드로: 시안에 커서 그림이 없어 새로 그렸다(11-11 시안 4종 중 사용자 선택). 고칠 때 글자 한 칸만 바꾸면 된다.
// 왜 32×32: 브라우저 커서는 32px까지 어디서나 안전하다(128px 넘으면 무시, 큰 커서는 화면 밖에서 잘림).
// 색은 사이트 팔레트만(피부·피부 그림자·유니폼·남색 소매·잉크). 클릭 지점은 검지 끝(globals.css의 11 1).
// 실행: node scripts/build-cursor.mjs
import sharp from 'sharp';

const COLOR = {
  k: [0x1e, 0x26, 0x38],
  p: [0xf7, 0xcf, 0xb2],
  q: [0xe3, 0xa6, 0x8a],
  t: [0x2e, 0x9b, 0xe0],
  d: [0x3d, 0x4e, 0x86],
};
const GRID = [
  '.....kk.........',
  '....kppk........',
  '....kppk........',
  '....kppk........',
  '....kppkkk......',
  '....kppkppkkk...',
  '.kk.kppkppkppkk.',
  'kppkkppkppkppkpk',
  'kpppkppppppppppk',
  '.kpppppppppppppk',
  '..kpppppppppppqk',
  '..kppppppppppqqk',
  '...kppppppppqqk.',
  '...kttttttttk...',
  '....kddddddddk..',
  '....kkkkkkkkkk..',
];

const raw = Buffer.alloc(16 * 16 * 4);
GRID.forEach((row, y) => {
  if (row.length !== 16) throw new Error(`${y}행 길이 ${row.length}`);
  [...row].forEach((ch, x) => {
    if (ch !== '.') raw.set([...COLOR[ch], 255], (y * 16 + x) * 4);
  });
});
const out = 'public/sprites/ui/cursor-hand-32x32.png';
const info = await sharp(raw, { raw: { width: 16, height: 16, channels: 4 } })
  .resize(32, 32, { kernel: 'nearest' })
  .png({ palette: true })
  .toFile(out);
console.log(`${out}: ${info.size}B`);
