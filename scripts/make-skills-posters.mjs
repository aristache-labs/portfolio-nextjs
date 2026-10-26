import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";

// Keep the original frame and focus; resize without cropping or replacing it.
const source = "public/media/skills.webp";
const original = await stat(source);
// Every poster sits under a 70-95% scrim, so 75 is visually identical to 90 at a fraction of
// the bytes. The full-width 1536w copy is what phones pick (cover width x DPR), so it is encoded
// too while the original stays untouched as the source.
const QUALITY = 75;
for (const width of [640, 960, 1280, 1536]) {
  const output = `public/media/skills-${width}.webp`;
  const buffer = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toBuffer();
  if (buffer.length >= original.size) throw new Error(`${output} would exceed the original size`);
  await writeFile(output, buffer);
  console.log(`${output}: ${buffer.length} bytes`);
}
