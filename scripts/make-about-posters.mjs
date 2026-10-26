import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";

// Preserve the approved full-frame original, also used by Services.
const source = "public/media/about.webp";
const original = await stat(source);
// Every poster sits under a 70-95% scrim, so 75 is visually identical to 90 at a fraction of
// the bytes. Unlike the other sections, the 1600w original is already smaller than a q75
// re-encode, so it stays the largest srcset entry.
const QUALITY = 75;
for (const width of [640, 960]) {
  const output = `public/media/about-${width}.webp`;
  const buffer = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();
  if (buffer.length >= original.size) throw new Error(`${output} would exceed the original size`);
  await writeFile(output, buffer);
  console.log(`${output}: ${buffer.length} bytes`);
}
