const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const root = path.resolve(__dirname, "..");
const iconsDir = path.join(root, "assets", "icons");

const COLORS = {
  transparent: [0, 0, 0, 0],
  ink: [21, 32, 43, 255],
  teal: [15, 118, 110, 255],
  tealLight: [132, 243, 215, 235],
  card: [250, 253, 255, 255],
  line: [216, 227, 236, 255],
  fuel: [192, 86, 33, 255],
};

const outputs = [
  ["favicon-16.png", 16],
  ["favicon-32.png", 32],
  ["favicon-48.png", 48],
  ["apple-touch-icon.png", 180],
  ["mstile-150.png", 150],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

fs.mkdirSync(iconsDir, { recursive: true });

for (const [filename, size] of outputs) {
  fs.writeFileSync(path.join(iconsDir, filename), createPng(size));
}

fs.writeFileSync(
  path.join(iconsDir, "favicon.ico"),
  createIco([
    ["favicon-16.png", 16],
    ["favicon-32.png", 32],
    ["favicon-48.png", 48],
  ]),
);

function createIco(entries) {
  const images = entries.map(([filename, size]) => ({
    size,
    data: fs.readFileSync(path.join(iconsDir, filename)),
  }));
  const headerSize = 6 + images.length * 16;
  let offset = headerSize;
  const buffer = Buffer.alloc(headerSize + images.reduce((sum, image) => sum + image.data.length, 0));

  buffer.writeUInt16LE(0, 0);
  buffer.writeUInt16LE(1, 2);
  buffer.writeUInt16LE(images.length, 4);

  images.forEach((image, index) => {
    const cursor = 6 + index * 16;
    buffer.writeUInt8(image.size >= 256 ? 0 : image.size, cursor);
    buffer.writeUInt8(image.size >= 256 ? 0 : image.size, cursor + 1);
    buffer.writeUInt8(0, cursor + 2);
    buffer.writeUInt8(0, cursor + 3);
    buffer.writeUInt16LE(1, cursor + 4);
    buffer.writeUInt16LE(32, cursor + 6);
    buffer.writeUInt32LE(image.data.length, cursor + 8);
    buffer.writeUInt32LE(offset, cursor + 12);
    image.data.copy(buffer, offset);
    offset += image.data.length;
  });

  return buffer;
}

function createPng(size) {
  const canvas = createCanvas(size, size);
  const s = size / 512;

  fillRoundedRect(canvas, 0, 0, size, size, 112 * s, COLORS.ink);
  fillCircle(canvas, 381 * s, 140 * s, 57 * s, COLORS.tealLight);
  fillRoundedRect(canvas, 112 * s, 102 * s, 288 * s, 308 * s, 51 * s, COLORS.card);
  fillRoundedRect(canvas, 112 * s, 102 * s, 288 * s, 86 * s, 51 * s, COLORS.teal);
  fillRect(canvas, 112 * s, 153 * s, 288 * s, 35 * s, COLORS.teal);

  drawLine(canvas, 156 * s, 334 * s, 156 * s, 183 * s, 34 * s, COLORS.ink);
  drawLine(canvas, 156 * s, 183 * s, 238 * s, 334 * s, 34 * s, COLORS.ink);
  drawLine(canvas, 238 * s, 334 * s, 238 * s, 183 * s, 34 * s, COLORS.ink);

  drawLine(canvas, 292 * s, 334 * s, 292 * s, 183 * s, 34 * s, COLORS.fuel);
  drawArc(canvas, 316 * s, 258 * s, 76 * s, -Math.PI / 2, Math.PI / 2, 34 * s, COLORS.fuel);
  drawLine(canvas, 292 * s, 183 * s, 316 * s, 183 * s, 34 * s, COLORS.fuel);
  drawLine(canvas, 292 * s, 334 * s, 316 * s, 334 * s, 34 * s, COLORS.fuel);

  drawLine(canvas, 159 * s, 371 * s, 351 * s, 371 * s, 16 * s, COLORS.line);
  drawLine(canvas, 159 * s, 371 * s, 247 * s, 371 * s, 16 * s, COLORS.teal);

  return encodePng(canvas);
}

function createCanvas(width, height) {
  return {
    width,
    height,
    pixels: new Uint8ClampedArray(width * height * 4),
  };
}

function setPixel(canvas, x, y, color) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= canvas.width || iy >= canvas.height) return;
  const offset = (iy * canvas.width + ix) * 4;
  canvas.pixels[offset] = color[0];
  canvas.pixels[offset + 1] = color[1];
  canvas.pixels[offset + 2] = color[2];
  canvas.pixels[offset + 3] = color[3];
}

function fillRect(canvas, x, y, width, height, color) {
  const left = Math.max(0, Math.floor(x));
  const top = Math.max(0, Math.floor(y));
  const right = Math.min(canvas.width, Math.ceil(x + width));
  const bottom = Math.min(canvas.height, Math.ceil(y + height));

  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      setPixel(canvas, px, py, color);
    }
  }
}

function fillCircle(canvas, cx, cy, radius, color) {
  const left = Math.floor(cx - radius);
  const right = Math.ceil(cx + radius);
  const top = Math.floor(cy - radius);
  const bottom = Math.ceil(cy + radius);
  const radiusSquared = radius * radius;

  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSquared) setPixel(canvas, x, y, color);
    }
  }
}

function fillRoundedRect(canvas, x, y, width, height, radius, color) {
  const left = Math.floor(x);
  const right = Math.ceil(x + width);
  const top = Math.floor(y);
  const bottom = Math.ceil(y + height);
  const r = Math.min(radius, width / 2, height / 2);

  for (let py = top; py < bottom; py += 1) {
    for (let px = left; px < right; px += 1) {
      const dx = Math.max(x + r - px, 0, px - (x + width - r));
      const dy = Math.max(y + r - py, 0, py - (y + height - r));
      if (dx * dx + dy * dy <= r * r) setPixel(canvas, px, py, color);
    }
  }
}

function drawLine(canvas, x1, y1, x2, y2, width, color) {
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(1, Math.ceil(distance));

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    fillCircle(canvas, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, width / 2, color);
  }
}

function drawArc(canvas, cx, cy, radius, start, end, width, color) {
  const steps = Math.max(16, Math.ceil(radius * Math.abs(end - start)));

  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps;
    const angle = start + (end - start) * t;
    fillCircle(canvas, cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, width / 2, color);
  }
}

function encodePng(canvas) {
  const stride = canvas.width * 4 + 1;
  const raw = Buffer.alloc(stride * canvas.height);

  for (let y = 0; y < canvas.height; y += 1) {
    const rowOffset = y * stride;
    raw[rowOffset] = 0;
    Buffer.from(canvas.pixels.buffer, y * canvas.width * 4, canvas.width * 4).copy(raw, rowOffset + 1);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr(canvas.width, canvas.height)),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function ihdr(width, height) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer.writeUInt8(8, 8);
  buffer.writeUInt8(6, 9);
  buffer.writeUInt8(0, 10);
  buffer.writeUInt8(0, 11);
  buffer.writeUInt8(0, 12);
  return buffer;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
