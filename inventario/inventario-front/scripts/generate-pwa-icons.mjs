import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../public/icons');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(size, getPixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const o = row + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function inRoundRect(x, y, size, radius) {
  const r = Math.max(0, Math.min(radius, size / 2));
  if (x >= r && x < size - r) return y >= 0 && y < size;
  if (y >= r && y < size - r) return x >= 0 && x < size;
  const dx = x < r ? r - x : x - (size - r);
  const dy = y < r ? r - y : y - (size - r);
  return dx * dx + dy * dy <= r * r;
}

function inFinder(px, py, left, top, module) {
  const x = Math.floor((px - left) / module);
  const y = Math.floor((py - top) / module);
  if (x < 0 || y < 0 || x > 6 || y > 6) return false;
  const ring = Math.max(Math.abs(x - 3), Math.abs(y - 3));
  return ring === 3 || ring <= 1;
}

function paint(size) {
  const bg = [14, 15, 54, 255];
  const ink = [255, 255, 255, 255];
  const accent = [186, 24, 20, 255];
  const pad = Math.round(size * 0.18);
  const inner = size - pad * 2;
  const module = inner / 25;
  const finder = 7 * module;
  const left = pad;
  const top = pad;
  const right = pad + inner - finder;
  const bottom = pad + inner - finder;

  return encodePng(size, (x, y) => {
    if (!inRoundRect(x, y, size, size * 0.18)) return [0, 0, 0, 0];
    if (
      inFinder(x, y, left, top, module)
      || inFinder(x, y, right, top, module)
      || inFinder(x, y, left, bottom, module)
    ) {
      return ink;
    }
    const cx = (x - size / 2) / module;
    const cy = (y - size / 2) / module;
    if (Math.abs(cx) < 1.1 && Math.abs(cy) < 4.2) return accent;
    if (Math.abs(cy) < 1.1 && Math.abs(cx) < 4.2) return accent;
    const gx = Math.floor((x - left) / module);
    const gy = Math.floor((y - top) / module);
    if (gx >= 0 && gy >= 0 && gx < 25 && gy < 25) {
      const inFinderZone =
        (gx < 9 && gy < 9) || (gx > 15 && gy < 9) || (gx < 9 && gy > 15);
      if (!inFinderZone && (gx + gy * 3) % 5 === 0) return ink;
    }
    return bg;
  });
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'pwa-192.png'), paint(192));
writeFileSync(join(OUT_DIR, 'pwa-512.png'), paint(512));
writeFileSync(join(OUT_DIR, 'apple-touch-icon.png'), paint(180));
console.log('Íconos PWA escritos en', OUT_DIR);
