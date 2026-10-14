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
