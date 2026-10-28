import sharp from "sharp";
import { mkdir } from "node:fs/promises";

// Current CA mark from the full logo. The wordmark begins below y=800 in the
// 906x939 source; y=790 ends inside the transparent gap without clipping the mark.
const renderedLogo = await sharp("assets/source/logo.svg").png().toBuffer();
const symbol = await sharp(renderedLogo)
  .extract({ left: 0, top: 0, width: 906, height: 790 })
  .png()
  .toBuffer();
const trimmed = await sharp(symbol).trim().png().toBuffer();

async function tile(size, out, scale = 0.78) {
  const inner = Math.round(size * scale);
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

// Existing App Router icons are official assets. Regenerate them only explicitly.
if (process.argv.includes("--metadata-icons")) {
  await tile(32, "src/app/icon.png");
  await tile(180, "src/app/apple-icon.png");
}
await mkdir("public/pwa", { recursive: true });
await tile(192, "public/pwa/icon-192-v2.png");
await tile(512, "public/pwa/icon-512-v2.png");
// Keep the mark inside the central safe circle for maskable icons.
await tile(512, "public/pwa/icon-maskable-512-v2.png", 0.56);

const logo = await sharp("assets/source/logo.svg")
  .resize({ width: 400 })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile("public/brand/logo-full-v2.webp");
console.log(`Footer logo: ${logo.width}x${logo.height}, ${logo.size} bytes`);

// Nav wordmark. The SVG source wraps a 1232px PNG behind a luminance mask, so it shipped ~45KB
// on the first screen. The nav shows it at most 14rem wide: 704px covers a 3x phone screen.
const wordmark = await sharp("assets/source/aristache-text.svg", { density: 144 })
  .resize({ width: 704 })
  .webp({ quality: 90, alphaQuality: 100, effort: 6 })
  .toFile("public/brand/aristache-text.webp");
console.log(
  `public/brand/aristache-text.webp: ${wordmark.width}x${wordmark.height}, ${wordmark.size} bytes`,
);
