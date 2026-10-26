import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";

// Resize the approved background without cropping; retain the full-resolution original.
const source = "public/media/projects.webp";
const original = await stat(source);
// Every poster sits under a 70-95% scrim, so 75 is visually identical to 90 at a fraction of
// the bytes. The full-width 1600w copy is what phones pick (cover width x DPR), so it is encoded
// too while the original stays untouched as the source.
const QUALITY = 75;
for (const width of [640, 960, 1600]) {
  const output = `public/media/projects-${width}.webp`;
  const buffer = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();
  if (buffer.length >= original.size) throw new Error(`${output} would exceed the original size`);
  await writeFile(output, buffer);
  console.log(`${output}: ${buffer.length} bytes`);
}
