import fs from "fs";
import sharp from "sharp";

async function bounds(name) {
  const svg = fs.readFileSync("public/brand/" + name, "utf8");
  const m = svg.match(/xlink:href="data:image\/png;base64,([^"]+)"/);
  const buf = Buffer.from(m[1], "base64");
  const meta = await sharp(buf).metadata();
  const trimmed = await sharp(buf)
    .ensureAlpha()
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true });
  console.log(
    JSON.stringify({
      name,
      w: meta.width,
      h: meta.height,
      trimW: trimmed.info.width,
      trimH: trimmed.info.height,
      ox: trimmed.info.trimOffsetLeft,
      oy: trimmed.info.trimOffsetTop,
    }),
  );
}

await bounds("aristache-monogram-light.svg");
await bounds("aristache-monogram-dark.svg");
