import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import UPNG from '@pdf-lib/upng';
import { NDA_TEMPLATE, NDA_TITLE, type NdaBlankKey } from './nda';
import { toAsciiDigits } from './phone';

/**
 * Server-only. The signed agreement as a PDF: GOLD's own PDF, with the signer's
 * details written on its blanks, the signature on its line and the date.
 *
 * Built from what's stored -- the details, the signature, when it was signed --
 * so it can be made again at any time and comes out the same.
 */

export type SignedNdaInput = {
  signer: { name: string; company: string; phone: string; email: string };
  /** The signature as drawn on the signing page: a PNG. */
  signature: Uint8Array;
  signedAt: Date;
};

const INK = rgb(0x23 / 255, 0x1f / 255, 0x20 / 255);
const GREY = rgb(0.5, 0.5, 0.5);
const MIN_FONT_SIZE = 7;
/** Space between a label's blank line start and the text written on it. */
const INSET = 4;
/** The text's baseline sits this far above its line, level with the printed label. */
const BASELINE_LIFT = 4.5;

// Arabic letters. Its digits are left out on purpose: numbers read left to right.
const ARABIC_LETTER = /[؀-ٟ٪-ۯۺ-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;
const LATIN_LETTER = /[A-Za-zÀ-ɏ]/;

const files = new Map<string, Promise<Buffer>>();

/** Read once per server start; a failed read is tried again next time. */
function readOnce(file: string): Promise<Buffer> {
  let pending = files.get(file);
  if (!pending) {
    pending = readFile(path.join(process.cwd(), file));
    pending.catch(() => files.delete(file));
    files.set(file, pending);
  }
  return pending;
}

type Run = { text: string; rtl: boolean };

/**
 * A value as runs in the order they sit on the line. fontkit joins an Arabic
 * run's letters and lays them right to left by itself; what's left is the order
 * of the runs, which follows the first letter's direction. That covers names,
 * companies and addresses, which is all this ever writes.
 */
function visualRuns(value: string): Run[] {
  const runs: Run[] = [];
  for (const char of value) {
    const last = runs[runs.length - 1];
    // A space stays with the words before it, so a phrase in either script holds together.
    if (last && (/\s/.test(char) || ARABIC_LETTER.test(char) === last.rtl)) {
      last.text += char;
    } else {
      runs.push({ text: char, rtl: ARABIC_LETTER.test(char) });
    }
  }
  // The space where one script meets the other belongs to neither: it sits between them.
  const spaced = runs.flatMap((run) => {
    const trailing = run.text.match(/\s+$/)?.[0];
    if (!trailing || trailing === run.text) return [run];
    return [
      { text: run.text.slice(0, -trailing.length), rtl: run.rtl },
      { text: trailing, rtl: false }
    ];
  });
  const firstArabic = value.search(ARABIC_LETTER);
  const firstLatin = value.search(LATIN_LETTER);
  const rtlLine = firstArabic !== -1 && (firstLatin === -1 || firstArabic < firstLatin);
  return rtlLine ? spaced.reverse() : spaced;
}

function runsWidth(runs: Run[], font: PDFFont, size: number): number {
  return runs.reduce((sum, run) => sum + font.widthOfTextAtSize(run.text, size), 0);
}

/** Writes one value on its blank, smaller if it's long, cut short only if it still won't fit. */
function writeOnBlank(pages: PDFPage[], font: PDFFont, key: NdaBlankKey, raw: string) {
  const value = toAsciiDigits(raw).replace(/\s+/g, ' ').trim();
  if (!value) return;
  const blank = NDA_TEMPLATE.blanks[key];
  const page = pages[blank.page];
  const x = blank.x + INSET;
  const maxWidth = NDA_TEMPLATE.lineEnd - x - INSET;

  let text = value;
  let size: number = NDA_TEMPLATE.fontSize;
  let runs = visualRuns(text);
  while (runsWidth(runs, font, size) > maxWidth && size > MIN_FONT_SIZE) {
    size -= 0.5;
  }
  while (runsWidth(runs, font, size) > maxWidth && text.length > 1) {
    text = `${text.slice(0, -2).trimEnd()}…`;
    runs = visualRuns(text);
  }

  let cursor = x;
  const y = NDA_TEMPLATE.height - (blank.lineY - BASELINE_LIFT);
  for (const run of runs) {
    if (run.text.trim()) page.drawText(run.text, { x: cursor, y, size, font, color: INK });
    cursor += font.widthOfTextAtSize(run.text, size);
  }
}

/**
 * The signature, ready for the page: cropped to its ink, with the paper made
 * clear so the line shows through. Older signatures were saved as the whole
 * white box they were drawn in; this makes those sit on the line too.
 */
function inkOnly(png: Uint8Array): Uint8Array {
  const image = UPNG.decode(png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer);
  const rgba = new Uint8Array(UPNG.toRGBA8(image)[0]);
  const { width, height } = image;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const lightness = Math.min(rgba[i], rgba[i + 1], rgba[i + 2]);
      // Near-white paper becomes clear; anything darker is ink.
      if (rgba[i + 3] === 0 || lightness > 235) {
        rgba[i + 3] = 0;
        continue;
      }
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) throw new Error('The signature has no ink.');

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;
  const cropped = new Uint8Array(cropWidth * cropHeight * 4);
  for (let y = 0; y < cropHeight; y += 1) {
    const from = ((minY + y) * width + minX) * 4;
    cropped.set(rgba.subarray(from, from + cropWidth * 4), y * cropWidth * 4);
  }
  return new Uint8Array(UPNG.encode([cropped.buffer], cropWidth, cropHeight, 0));
}

function cairoDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'long', year: 'numeric' });
}

function cairoTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { timeZone: 'Africa/Cairo', hour: '2-digit', minute: '2-digit' });
}

export async function buildSignedNdaPdf(input: SignedNdaInput): Promise<Uint8Array> {
  const [template, fontFile] = await Promise.all([
    readOnce(NDA_TEMPLATE.pdfPath),
    readOnce('lib/fonts/Tajawal-Regular.ttf')
  ]);

  const doc = await PDFDocument.load(template);
  doc.registerFontkit(fontkit);
  // Tajawal has both Latin and Arabic letters, so a name typed in either reads right.
  const font = await doc.embedFont(fontFile, { subset: true });
  const pages = doc.getPages();
  const { signer, signedAt } = input;

  writeOnBlank(pages, font, 'partyName', signer.name);
  writeOnBlank(pages, font, 'partyCompany', signer.company);
  writeOnBlank(pages, font, 'partyPhone', signer.phone);
  writeOnBlank(pages, font, 'partyEmail', signer.email);
  writeOnBlank(pages, font, 'signName', signer.name);
  writeOnBlank(pages, font, 'signCompany', signer.company);
  writeOnBlank(pages, font, 'signDate', cairoDate(signedAt));

  const signature = await doc.embedPng(inkOnly(input.signature));
  const box = NDA_TEMPLATE.signature;
  const scale = Math.min(box.width / signature.width, box.height / signature.height);
  const width = signature.width * scale;
  const height = signature.height * scale;
  const top = box.top + (box.height - height) / 2;
  pages[box.page].drawImage(signature, { x: box.x, y: NDA_TEMPLATE.height - top - height, width, height });

  const stamp = `Signed electronically at gold-eg.com on ${cairoDate(signedAt)}, ${cairoTime(signedAt)} Cairo time.`;
  const stampSize = 7.5;
  pages[box.page].drawText(stamp, {
    x: (NDA_TEMPLATE.width - font.widthOfTextAtSize(stamp, stampSize)) / 2,
    y: NDA_TEMPLATE.height - NDA_TEMPLATE.stampY,
    size: stampSize,
    font,
    color: GREY
  });

  doc.setTitle(`${NDA_TITLE} — signed by ${signer.name}`);
  doc.setSubject('Signed confidentiality agreement');
  doc.setProducer('gold-eg.com');
  doc.setCreator('gold-eg.com');
  doc.setCreationDate(signedAt);
  doc.setModificationDate(signedAt);
  return doc.save();
}

/** A file name for the signed copy, safe in a download header. */
export function signedNdaFileName(name: string): string {
  const slug = name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'signed';
  return `GOLD-NDA-${slug}.pdf`;
}
