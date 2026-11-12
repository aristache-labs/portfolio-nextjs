import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { stat, writeFile } from "node:fs/promises";

// A section backdrop shows its poster until the loop starts playing, then the video takes over in
// the same box with the same object-fit. If the poster is a different picture, the scene jumps
// the moment playback begins (a globe on the right that suddenly sits on the left). So these
// posters are the loop's own first frame, never a separate illustration.
//
// Needs ffmpeg on PATH. Run after replacing a video: node scripts/make-video-posters.mjs
const FRAME = 0;
const QUALITY = 78;

// The `-frame` names are new on purpose: /media is cached for 30 days, so returning visitors would
// keep the old posters under an unchanged name. Services and the legal pages play the About loop,
// so they share its first frame. Hero, Experience and Projects posters already match their loops.
const POSTERS = [
  {
    video: "about-v3",
    sizes: { "about-frame-640": 640, "about-frame-960": 960, "about-frame": 1600 },
  },
  {
    video: "skills-v2",
    sizes: {
      "skills-frame-640": 640,
      "skills-frame-960": 960,
      "skills-frame-1280": 1280,
      "skills-frame-1536": 1536,
      "skills-frame": 1536,
    },
  },
  {
    video: "contact-v3",
    sizes: {
      "contact-frame-640": 640,
      "contact-frame-960": 960,
      "contact-frame-1600": 1600,
      "contact-frame": 1600,
    },
  },
];

function firstFrame(video) {
  return execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      `public/media/${video}.mp4`,
      "-vf",
      `select=eq(n\\,${FRAME})`,
      "-frames:v",
      "1",
      "-f",
      "image2pipe",
      "-c:v",
      "png",
      "-",
    ],
    { maxBuffer: 64 * 1024 * 1024 },
  );
}

for (const { video, sizes } of POSTERS) {
  const frame = firstFrame(video);
  for (const [name, width] of Object.entries(sizes)) {
    const output = `public/media/${name}.webp`;
    const before = await stat(output).then(
      (s) => s.size,
      () => 0,
    );
    const buffer = await sharp(frame)
      .resize({ width })
      .webp({ quality: QUALITY, effort: 6 })
      .toBuffer();
    await writeFile(output, buffer);
    console.log(`${output}: ${before} -> ${buffer.length} bytes`);
  }
}
