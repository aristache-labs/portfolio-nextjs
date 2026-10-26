import sharp from "sharp";

const src = "public/brand/aristache-monogram.png";
const trimmed = await sharp(src).trim().png().toBuffer();

async function tile(size, out) {
  const inner = Math.round(size * 0.78);
  const mark = await sharp(trimmed)
    .resize(inner, inner, {
      fit: "inside",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 8, g: 12, b: 13, alpha: 1 },
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(out);
}

await tile(32, "src/app/icon.png");
await tile(180, "src/app/apple-icon.png");

// Nav wordmark. The SVG source wraps a 1232px PNG behind a luminance mask, so it shipped ~45KB
// on the first screen. The nav shows it at most 14rem wide: 704px covers a 3x phone screen.
const wordmark = await sharp("public/brand/aristache-text.svg", { density: 144 })
  .resize({ width: 704 })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile("public/brand/aristache-text.webp");
console.log(
  `public/brand/aristache-text.webp: ${wordmark.width}x${wordmark.height}, ${wordmark.size} bytes`,
);
