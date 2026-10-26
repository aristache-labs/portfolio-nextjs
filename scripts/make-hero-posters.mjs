import sharp from "sharp";

// Derive every variant from the currently approved full-resolution poster.
// The smaller PNG is not the source: using it would lose existing image detail.
const source = "public/media/hero.webp";
// Every variant sits under the vignette and noise, and on phones under a 70% scrim, so 75 is
// visually identical to 95 at less than half the bytes. The portrait crop is the mobile LCP
// element: at 95 it took ~4s on Slow 4G.
const QUALITY = 75;
const { width, height } = await sharp(source).metadata();
if (!width || !height) throw new Error("Hero poster dimensions are missing");

for (const target of [960, 1280]) {
  const output = `public/media/hero-${target}.webp`;
  const info = await sharp(source)
    .resize({ width: target, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(output);
  console.log(`${output}: ${info.width}x${info.height}, ${info.size} bytes`);
}

// The portrait picture occupies 75% of the hero height. A square source keeps
// enough horizontal detail for viewport shapes up to 3:4 without extra cropping.
// Match the source width parity so the crop stays exactly centered.
let portraitWidth = height;
if ((width - portraitWidth) % 2 !== 0) portraitWidth += 1;
if (portraitWidth > width) throw new Error("Hero source is too narrow for the portrait crop");
const portrait = "public/media/hero-portrait.webp";
const info = await sharp(source)
  .extract({
    left: Math.floor((width - portraitWidth) / 2),
    top: 0,
    width: portraitWidth,
    height,
  })
  .webp({ quality: QUALITY, effort: 6 })
  .toFile(portrait);
console.log(`${portrait}: ${info.width}x${info.height}, ${info.size} bytes`);
