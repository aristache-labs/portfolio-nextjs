import sharp from "sharp";
import { writeFileSync } from "node:fs";

const files = [
  "aristache-monogram-light",
  "aristache-monogram-dark",
  "aristache-logo-light",
  "aristache-logo-dark",
];

for (const name of files) {
  const { data, info } = await sharp(`public/brand/${name}.svg`, { density: 192 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) data[i + 3] = 0;
  }
  const png = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
  writeFileSync(`public/brand/${name}.png`, png);
  for (const bg of ["#f4f7f6", "#121816"]) {
    const flat = await sharp(png).flatten({ background: bg }).png().toBuffer();
    writeFileSync(`public/brand/_preview-${name}-${bg.slice(1)}.png`, flat);
  }
  console.log(name, `${info.width}x${info.height}`);
}
