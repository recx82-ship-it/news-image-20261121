// News-image entry for Saturday 21 November 2026 (Node 22, standard library only).
// The entry image is entry.png beside this file: a newspaper front page
// summing up the FULL day of Saturday 21 November 2026 — the Trump-Xi-Putin
// trilateral summit in Shenzhen ends with a pledge that "a nuclear war cannot
// be won and must never be fought" and Trump telling Europe to defund Ukraine,
// Russia's biggest strike of the war (400+ drones, 110 missiles; eight killed
// in Kyiv; missiles land in Poland), the ICJ ruling Myanmar guilty of genocide
// against the Rohingya, global markets sliding into correction (S&P 500 -3.7%,
// Nikkei -5.1%), the deepening Iran crisis, and COP31 in overtime in Antalya
// with fossil fuels cut from the draft. Rebuilt in the evening from the full
// day's news; it replaces the morning version built from overnight news only.
// The program checks the image against the bounty gate (whole PNG or JPEG,
// at most 1 MiB, at most 1024 by 1024 pixels) and writes it to
// /output/entry.png, the path the grader reads.

import { copyFileSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const OUT_NAME = 'entry.png';
const SRC = new URL(`./${OUT_NAME}`, import.meta.url);
const image = readFileSync(SRC);

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

function hasMagic(buf: Buffer, magic: number[]): boolean {
  return magic.every((byte, i) => buf[i] === byte);
}

const isPng = hasMagic(image, PNG_MAGIC);
const isJpeg = hasMagic(image, JPEG_MAGIC);
if (!isPng && !isJpeg) {
  throw new Error('entry.png is neither a PNG nor a JPEG');
}
if (image.length > 1024 * 1024) {
  throw new Error(`entry.png is ${image.length} bytes, over the 1 MiB gate`);
}

function pngSize(buf: Buffer): [number, number] {
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

function jpegSize(buf: Buffer): [number, number] {
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) throw new Error('corrupt JPEG marker stream');
    const marker = buf[offset + 1];
    const length = buf.readUInt16BE(offset + 2);
    if (marker === 0xc0 || marker === 0xc2) {
      return [buf.readUInt16BE(offset + 7), buf.readUInt16BE(offset + 5)];
    }
    offset += 2 + length;
  }
  throw new Error('no JPEG start-of-frame segment found');
}

const [width, height] = isPng ? pngSize(image) : jpegSize(image);
if (width > 1024 || height > 1024) {
  throw new Error(`image is ${width}x${height}, over the 1024x1024 gate`);
}

mkdirSync(OUT_DIR, { recursive: true });
const dest = join(OUT_DIR, OUT_NAME);
copyFileSync(SRC, dest);
const written = statSync(dest);
console.log(
  `Entry image: ${isJpeg ? 'JPEG' : 'PNG'}, ${width}x${height}, ` +
  `${image.length} bytes, copied to ${dest} (${written.size} bytes)`,
);
