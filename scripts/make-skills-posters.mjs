import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";

// Keep the original frame and focus; resize without cropping or replacing it.
const source = "public/media/skills.webp";
const original = await stat(source);
for (const width of [640, 960, 1280]) {
  const output = `public/media/skills-${width}.webp`;
  const buffer = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
  if (buffer.length >= original.size) throw new Error(`${output} would exceed the original size`);
  await writeFile(output, buffer);
  console.log(`${output}: ${buffer.length} bytes`);
}
