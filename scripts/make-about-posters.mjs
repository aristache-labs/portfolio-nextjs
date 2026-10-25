import sharp from "sharp";
import { stat, writeFile } from "node:fs/promises";

// Preserve the approved full-frame original, also used by Services.
const source = "public/media/about.webp";
const original = await stat(source);
for (const width of [640, 960]) {
  const output = `public/media/about-${width}.webp`;
  const buffer = await sharp(source)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
  if (buffer.length >= original.size) throw new Error(`${output} would exceed the original size`);
  await writeFile(output, buffer);
  console.log(`${output}: ${buffer.length} bytes`);
}
