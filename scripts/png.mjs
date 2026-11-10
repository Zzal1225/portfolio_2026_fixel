// 최소 PNG 읽기·쓰기(8비트 RGBA·RGB·팔레트, 인터레이스 없음). 그림 굽기 스크립트 전용.
// 외부 라이브러리 없이 zlib만 쓴다(저장소 의존성을 늘리지 않으려고).
import fs from 'node:fs';
import zlib from 'node:zlib';

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

/** → { w, h, data: Uint8Array(RGBA) } */
export function readPng(file) {
  const buf = fs.readFileSync(file);
  let p = 8;
  let w = 0,
    h = 0,
    depth = 0,
    type = 0,
    palette = null,
    trns = null;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p);
    const kind = buf.toString('ascii', p + 4, p + 8);
    const body = buf.subarray(p + 8, p + 8 + len);
    if (kind === 'IHDR') {
      w = body.readUInt32BE(0);
      h = body.readUInt32BE(4);
      depth = body[8];
      type = body[9];
      if (body[12] !== 0) throw new Error('interlace not supported');
    } else if (kind === 'PLTE') palette = body;
    else if (kind === 'tRNS') trns = body;
    else if (kind === 'IDAT') idat.push(body);
    p += 12 + len;
  }
  if (depth !== 8) throw new Error(`bit depth ${depth} not supported`);
  const ch = { 6: 4, 2: 3, 3: 1 }[type];
  if (!ch) throw new Error(`color type ${type} not supported`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * ch;
  const px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= ch ? px[y * stride + x - ch] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? px[(y - 1) * stride + x - ch] : 0;
      let pred = 0;
      if (f === 1) pred = a;
      else if (f === 2) pred = b;
      else if (f === 3) pred = (a + b) >> 1;
      else if (f === 4) {
        const pp = a + b - c,
          pa = Math.abs(pp - a),
          pb = Math.abs(pp - b),
          pc = Math.abs(pp - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = (v + pred) & 0xff;
    }
  }
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (ch === 4) data.set(px.subarray(i * 4, i * 4 + 4), i * 4);
    else if (ch === 3) data.set([px[i * 3], px[i * 3 + 1], px[i * 3 + 2], 255], i * 4);
    else {
      const k = px[i];
      data.set(
        [
          palette[k * 3],
          palette[k * 3 + 1],
          palette[k * 3 + 2],
          trns && k < trns.length ? trns[k] : 255,
        ],
        i * 4,
      );
    }
  }
  return { w, h, data };
}

export function writePng(file, { w, h, data }) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    Buffer.from(data.buffer, data.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const td = Buffer.concat([Buffer.from(type), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0)),
    ]),
  );
}

/** 정수 배 확대(눈으로 확인용) */
export function scaleUp(img, k) {
  const out = new Uint8Array(img.w * k * img.h * k * 4);
  for (let y = 0; y < img.h * k; y++)
    for (let x = 0; x < img.w * k; x++) {
      const s = (Math.floor(y / k) * img.w + Math.floor(x / k)) * 4;
      out.set(img.data.subarray(s, s + 4), (y * img.w * k + x) * 4);
    }
  return { w: img.w * k, h: img.h * k, data: out };
}
