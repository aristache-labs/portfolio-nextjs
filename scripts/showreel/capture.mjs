// Scripted capture of the live portfolio for the showreel: one slow, continuous scroll.
//   node scripts/showreel/capture.mjs desktop|mobile [--dry]
// The timeline lives in flow.json and is identical on both layouts, so the laptop and the phone
// reach every section at the same moment. --dry runs headless, records nothing and saves a still
// at each anchor into screenshots/showreel/dry. Consent is preset to "rejected": no banner and
// no Google Analytics traffic.
import { chromium } from "playwright";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] === "mobile" ? "mobile" : "desktop";
const dry = process.argv.includes("--dry");
const url = process.env.PORTFOLIO_URL ?? "https://www.aristache.dev/";
const here = path.dirname(fileURLToPath(import.meta.url));
// Footage and stills stay out of git: screenshots/ is ignored.
const out = path.resolve(here, "..", "..", "screenshots", "showreel");
const flow = JSON.parse(await readFile(path.join(here, "flow.json"), "utf8"));
const mobile = mode === "mobile";
// Same visible-page sizes as scripts/record-portfolio.mjs: the browser chrome takes the rest of
// the 1920x1200 / 440x956 screens, so exactly one section fits per frame.
const viewport = mobile ? { width: 440, height: 852 } : { width: 1920, height: 1000 };
const rawFile = path.join(out, "raw", `${mode}.mkv`);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (...a) => console.log(`[${mode}]`, ...a);

await mkdir(path.join(out, "raw"), { recursive: true });
await mkdir(path.join(out, "dry"), { recursive: true });

const browser = await chromium.launch({
  headless: dry,
  ...(dry ? {} : { channel: "chrome" }),
  ignoreDefaultArgs: ["--enable-automation"],
  args: [
    "--force-device-scale-factor=1",
    "--hide-scrollbars",
    "--disable-infobars",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-features=Translate,TranslateUI",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--disable-backgrounding-occluded-windows",
    "--autoplay-policy=no-user-gesture-required",
    "--window-position=0,0",
  ],
});

const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  isMobile: mobile,
  hasTouch: mobile,
  colorScheme: "dark",
  reducedMotion: "no-preference",
});

await context.addInitScript(() => {
  try {
    localStorage.setItem("analytics-consent-v2", "rejected");
  } catch {}
  // Scripted scrolling can emit scrollend between frames; real visitors do not.
  addEventListener("scrollend", (event) => event.stopImmediatePropagation(), true);
  addEventListener("DOMContentLoaded", () => {
    const style = document.createElement("style");
    style.textContent = `
      html { scroll-behavior: auto !important; scrollbar-width: none !important; }
      ::-webkit-scrollbar { display: none !important; }
      * { cursor: none !important; }`;
    document.head.append(style);
  });
});

const page = await context.newPage();

// Headed Chrome ignores --kiosk here, so find where the page really lands on the screen:
// size the window, paint the page magenta, grab one desktop frame and measure the magenta box.
let region = { x: 0, y: 0 };
if (!dry) {
  const cdp = await context.newCDPSession(page);
  const { windowId } = await cdp.send("Browser.getWindowForTarget");
  let left = mobile ? 0 : -8;
  let extraWidth = 0;
  let found = null;
  for (let attempt = 0; attempt < 5 && !found; attempt++) {
    await cdp.send("Browser.setWindowBounds", {
      windowId,
      bounds: {
        left,
        top: 0,
        width: (mobile ? 560 : viewport.width + 16) + extraWidth,
        height: mobile ? 1060 : 1200,
        windowState: "normal",
      },
    });
    await page.setContent('<body style="margin:0;background:#ff00ff"></body>');
    await sleep(900);
    const png = path.join(out, "raw", "geometry.png");
    spawnSync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "ddagrab=framerate=30:draw_mouse=0:output_idx=0",
      "-frames:v",
      "1",
      "-vf",
      "hwdownload,format=bgra",
      png,
    ]);
    const measured = spawnSync("python", [path.join(here, "geom.py"), png])
      .stdout.toString()
      .trim();
    const [x, y, w, h] = measured.split(" ").map(Number);
    log(`page region on screen: x=${x} y=${y} ${w}x${h}`);
    if (w >= viewport.width && h >= viewport.height) found = { x, y };
    else {
      if (x > 0 && !mobile) left -= x;
      if (w < viewport.width) extraWidth += viewport.width - w;
    }
  }
  if (!found) throw new Error("Could not align the capture window to the expected viewport.");
  region = found;
}

// Wait until nothing is moving: no running finite animation or transition, and the page text
// (which includes the animated counters) unchanged for `quiet` ms.
async function settle({ quiet = 1200, max = 9000 } = {}) {
  await page.evaluate(
    ({ quiet, max }) =>
      new Promise((resolve) => {
        const t0 = performance.now();
        let last = document.body.innerText;
        let stableSince = t0;
        const tick = () => {
          const now = performance.now();
          const text = document.body.innerText;
          const busy = document.getAnimations().some((a) => {
            if (a.playState !== "running") return false;
            return Number.isFinite(a.effect?.getComputedTiming().endTime);
          });
          if (busy || text !== last) {
            last = text;
            stableSince = now;
          }
          if (now - stableSince >= quiet || now - t0 >= max) resolve();
          else setTimeout(tick, 80);
        };
        tick();
      }),
    { quiet, max },
  );
}

// Plain scroll used only to warm the cache.
async function glide(y, ms) {
  await page.evaluate(
    ({ y, ms }) =>
      new Promise((resolve) => {
        const from = scrollY;
        const distance =
          Math.max(0, Math.min(y, document.documentElement.scrollHeight - innerHeight)) - from;
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
        const t0 = performance.now();
        const frame = (now) => {
          const t = Math.min((now - t0) / ms, 1);
          scrollTo(0, from + distance * ease(t));
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      }),
    { y, ms },
  );
}

// Warm the HTTP cache so the recorded visit paints without network stalls.
log("warm-up");
await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
await page.locator("h1").waitFor({ state: "visible", timeout: 60_000 });
await glide(await page.evaluate(() => document.documentElement.scrollHeight), dry ? 4000 : 9000);
await sleep(1200);
await glide(0, 800);
await sleep(600);

// Neutral dark page so the cut from "nothing" to the site is seamless.
await page.goto(
  "data:text/html,<html style='background:%23080c0d'><body style='margin:0;background:%23080c0d'></body></html>",
);
await sleep(500);

let ffmpeg = null;
if (!dry) {
  const filter = `hwdownload,format=bgra,format=yuv420p,crop=${viewport.width}:${viewport.height}:${region.x}:${region.y}`;
  ffmpeg = spawn(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "warning",
      "-y",
      "-f",
      "lavfi",
      "-i",
      "ddagrab=framerate=60:draw_mouse=0:output_idx=0",
      "-vf",
      filter,
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-crf",
      "12",
      rawFile,
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  await sleep(1500);
}
log("recording");

await page.goto(url, { waitUntil: "commit" });
await page.locator("h1").waitFor({ state: "visible", timeout: 30_000 });
// The hero entrance (typing, fades) plays on its own before the scroll starts.
await settle({ quiet: 900 });
await sleep(1500);

// Sync marker: a magenta square in the top-left corner for 250 ms. The montage finds it in each
// recording to line the two devices up, and starts after it, so it never appears in the result.
await page.evaluate(() => {
  const marker = document.createElement("div");
  marker.style.cssText =
    "position:fixed;left:0;top:0;width:8px;height:8px;background:#ff00ff;z-index:2147483647;pointer-events:none";
  document.body.append(marker);
  setTimeout(() => marker.remove(), 250);
});
await sleep(550);

// Anchor positions: each section's top (below the sticky header) and the very bottom.
const points = await page.evaluate((anchors) => {
  const nav = document.querySelector("header")?.getBoundingClientRect().height ?? 72;
  const bottom = document.documentElement.scrollHeight - innerHeight;
  const list = [[0, 0]];
  for (const [selector, seconds] of anchors) {
    let y = bottom;
    if (selector !== "bottom") {
      const el = document.querySelector(selector);
      if (!el) throw new Error(`no ${selector}`);
      y = Math.min(bottom, Math.max(0, el.getBoundingClientRect().top + scrollY - nav));
    }
    list.push([seconds, Math.max(y, list.at(-1)[1])]);
  }
  return list;
}, flow.anchors);
log("scroll points", JSON.stringify(points));

// Smooth, monotone cubic (PCHIP) through the points: continuous speed, no stops between sections,
// easing only at the very start and end.
await page.evaluate((points) => {
  const ts = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const n = ts.length;
  const h = [];
  const delta = [];
  for (let i = 0; i < n - 1; i++) {
    h[i] = ts[i + 1] - ts[i];
    delta[i] = (ys[i + 1] - ys[i]) / h[i];
  }
  const d = new Array(n).fill(0);
  for (let i = 1; i < n - 1; i++) {
    if (delta[i - 1] * delta[i] <= 0) continue;
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    d[i] = (w1 + w2) / (w1 / delta[i - 1] + w2 / delta[i]);
  }
  const at = (t) => {
    let i = 0;
    while (i < n - 2 && t > ts[i + 1]) i++;
    const s = Math.min(1, Math.max(0, (t - ts[i]) / h[i]));
    const s2 = s * s;
    const s3 = s2 * s;
    return (
      (2 * s3 - 3 * s2 + 1) * ys[i] +
      (s3 - 2 * s2 + s) * h[i] * d[i] +
      (-2 * s3 + 3 * s2) * ys[i + 1] +
      (s3 - s2) * h[i] * d[i + 1]
    );
  };
  const total = ts[n - 1];
  window.__flow = { done: false };
  const t0 = performance.now();
  const frame = (now) => {
    const t = Math.min((now - t0) / 1000, total);
    scrollTo(0, at(t));
    if (t < total) requestAnimationFrame(frame);
    else window.__flow.done = true;
  };
  requestAnimationFrame(frame);
}, points);
const startedAt = Date.now();

if (dry) {
  // Real-time stills at each anchor, to check what is on screen when a section is reached.
  const stills = [
    ...flow.anchors,
    ...(flow.probes ?? []).map((seconds) => ["probe", seconds]),
  ].sort((a, b) => a[1] - b[1]);
  for (const [selector, seconds] of stills) {
    const wait = seconds * 1000 - (Date.now() - startedAt);
    if (wait > 0) await sleep(wait);
    await page.screenshot({
      path: path.join(
        out,
        "dry",
        `${mode}-${String(seconds).padStart(4, "0")}s-${selector.replace("#", "")}.png`,
      ),
    });
  }
}
await page.waitForFunction(() => window.__flow.done, null, { timeout: 120_000, polling: 250 });
await sleep(flow.holdAfterS * 1000);

if (ffmpeg) {
  ffmpeg.stdin.write("q");
  await new Promise((resolve) => ffmpeg.on("close", resolve));
  log("saved", rawFile);
}
await context.close();
await browser.close();
