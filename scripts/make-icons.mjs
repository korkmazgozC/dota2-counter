#!/usr/bin/env node
// Generates the app icons (SVG + PNGs for Android/iOS) with no dependencies.
// The PNGs are rasterised from the same geometry as the SVG using signed-distance shapes.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
mkdirSync(OUT, { recursive: true });

// Geometry in unit space (0..1).
const RING = { r: 0.30, w: 0.045 };
const BLADE_W = 0.075;
const BLADES = [[0.27, 0.27, 0.73, 0.73], [0.73, 0.27, 0.27, 0.73]];

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e2483d"/><stop offset="1" stop-color="#5a0f14"/></linearGradient></defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <circle cx="256" cy="256" r="${RING.r * 512}" fill="none" stroke="#e7b75a" stroke-width="${RING.w * 512}"/>
  ${BLADES.map(([x1, y1, x2, y2]) => `<line x1="${x1 * 512}" y1="${y1 * 512}" x2="${x2 * 512}" y2="${y2 * 512}" stroke="#fff" stroke-width="${BLADE_W * 512}" stroke-linecap="round"/>`).join('\n  ')}
</svg>
`;
writeFileSync(path.join(OUT, 'icon.svg'), svg);

function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function roundRectDist(px, py, r) {
  const qx = Math.abs(px - 0.5) - (0.5 - r), qy = Math.abs(py - 0.5) - (0.5 - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const cov = (d, px) => Math.max(0, Math.min(1, 0.5 - d / px)); // anti-aliased coverage

function render(size, { corner = 112 / 512, scale = 1 } = {}) {
  const buf = Buffer.alloc(size * size * 4);
  const px = 1 / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size, v = (y + 0.5) / size;
      // Emblem coordinates (scaled toward centre for maskable safe zone).
      const eu = 0.5 + (u - 0.5) / scale, ev = 0.5 + (v - 0.5) / scale;
      const t = (u + v) / 2;
      let col = mix([226, 72, 61], [90, 15, 20], t);
      let alpha = corner > 0 ? cov(roundRectDist(u, v, corner), px) : 1;
      const ring = Math.abs(Math.hypot(eu - 0.5, ev - 0.5) - RING.r) - RING.w / 2;
      col = mix(col, [231, 183, 90], cov(ring * scale, px));
      const blade = Math.min(...BLADES.map(([a, b, c, d]) => segDist(eu, ev, a, b, c, d))) - BLADE_W / 2;
      col = mix(col, [255, 255, 255], cov(blade * scale, px));
      const i = (y * size + x) * 4;
      buf[i] = col[0]; buf[i + 1] = col[1]; buf[i + 2] = col[2]; buf[i + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, size, buf);
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

writeFileSync(path.join(OUT, 'icon-192.png'), render(192));
writeFileSync(path.join(OUT, 'icon-512.png'), render(512));
writeFileSync(path.join(OUT, 'maskable-512.png'), render(512, { corner: 0, scale: 0.8 }));
// iOS applies its own rounded mask and dislikes transparency: full-bleed square.
writeFileSync(path.join(OUT, 'apple-touch-icon.png'), render(180, { corner: 0 }));
console.log('Icons written to', OUT);
