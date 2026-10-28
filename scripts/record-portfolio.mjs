import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Run: node record-portfolio.mjs
// Optional: PORTFOLIO_URL, CHROME_CHANNEL=chrome, FFMPEG_PATH, SCROLL_MULTIPLIER=2
// A larger multiplier gives visitors longer to see each section.
const url = process.env.PORTFOLIO_URL || 'https://www.aristache.dev/';
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const multiplier = Number(process.env.SCROLL_MULTIPLIER || 1.5);
const smoothVideo = process.env.SMOOTH_VIDEO !== '0';
const fps = smoothVideo ? 60 : 30;
const videoFilter = smoothVideo
  ? 'minterpolate=fps=60:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,setsar=1'
  : 'fps=30,setsar=1';
if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('SCROLL_MULTIPLIER must be positive.');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', 'screenshots/video');

function encode(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'warning', '-y', ...args], { stdio: 'inherit' });
  if (result.error) throw new Error(`Cannot start FFmpeg: ${result.error.message}. Install FFmpeg and restart your terminal.`);
  if (result.status !== 0) throw new Error(`FFmpeg failed (exit ${result.status}). Raw recordings remain in ${root}`);
}

async function capture(browser, name, viewport, scrollSeconds, mobile) {
  const context = await browser.newContext({
    viewport,
    screen: viewport,
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
    recordVideo: { dir: path.join(root, 'raw'), size: viewport },
  });
  // Repeated scripted scrollTo calls can emit scrollend between animation frames.
  // Suppress that fallback during this automated capture so the site's observers
  // can run entrances at their intended viewport inset. Real visitors are unaffected.
  await context.addInitScript(() => {
    window.addEventListener('scrollend', event => event.stopImmediatePropagation(), true);
  });
  // Playwright records from page creation; trim only the initial loading later.
  const recordingEpoch = performance.now();
  const page = await context.newPage();
  const video = page.video();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await page.locator('h1').waitFor({ state: 'visible', timeout: 60_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: `
      html { scroll-behavior: auto !important; scrollbar-width: none !important; }
      ::-webkit-scrollbar { display: none !important; }
      * { cursor: none !important; caret-color: transparent !important; }
    ` });
    await page.mouse.move(1, 1);

    // Keep sections unvisited: their one-time reveals must run during the capture.
    // Decode only images in the opening viewport; lazy media loads during scrolling.
    await page.evaluate(async () => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      const visibleImages = [...document.images].filter(image => {
        const rect = image.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
      });
      await Promise.all(visibleImages.map(image =>
        Promise.race([image.decode().catch(() => {}), delay(5_000)])
      ));
    });

    const start = (performance.now() - recordingEpoch) / 1000;
    const contentStart = performance.now();
    await page.waitForTimeout(2_000);
    // Smooth continuous scroll with a short acceleration/deceleration at the ends.
    await page.evaluate(async milliseconds => {
      const position = t => {
        const ramp = 0.08;
        const speed = 1 / (1 - ramp);
        if (t < ramp) return speed * t * t / (2 * ramp);
        if (t > 1 - ramp) return 1 - speed * (1 - t) ** 2 / (2 * ramp);
        return speed * (t - ramp / 2);
      };
      await new Promise(resolve => {
        let began;
        const frame = now => {
          began ??= now;
          const t = Math.min((now - began) / milliseconds, 1);
          const bottom = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - innerHeight;
          scrollTo(0, bottom * position(t));
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      });
    }, scrollSeconds * multiplier * 1000);
    await page.waitForTimeout(2_000);
    const duration = (performance.now() - contentStart) / 1000;
    await context.close();
    const raw = path.join(root, `${name}-raw.webm`);
    await video.saveAs(raw);
    const output = path.join(root, `${name}.mp4`);
    console.log(`Exporting ${name} at ${fps} fps${smoothVideo ? ' with motion interpolation (may take several minutes)' : ''}...`);
    encode(['-ss', String(start), '-i', raw, '-t', String(duration), '-an',
      '-vf', videoFilter, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output]);
    return { output, duration };
  } catch (error) {
    await context.close().catch(() => {});
    throw error;
  }
}

async function main() {
  // Check dependencies before spending time recording.
  encode(['-version']);
  await mkdir(root, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
  });
  try {
    console.log('Recording desktop: full page at 1920 x 1080...');
    const desktop = await capture(browser, 'desktop', { width: 1920, height: 1080 }, 22, false);
    console.log('Recording mobile: full page at 432 x 864...');
    const mobile = await capture(browser, 'mobile', { width: 432, height: 864 }, 26, true);
    console.log('Building the combined presentation...');
    const presentation = path.join(root, 'aristache-presentation.mp4');
    const fade = (length) => `fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0, length - 0.35)}:d=0.35`;
    const filter = [
      `[0:v]setpts=PTS-STARTPTS,setsar=1,${fade(desktop.duration)}[desktop]`,
      `[1:v]setpts=PTS-STARTPTS,scale=480:960:flags=lanczos,setsar=1,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x080c0d,${fade(mobile.duration)}[mobile]`,
      '[desktop][mobile]concat=n=2:v=1:a=0[out]',
    ].join(';');
    encode(['-i', desktop.output, '-i', mobile.output, '-filter_complex', filter,
      '-map', '[out]', '-an', '-r', String(fps), '-c:v', 'libx264', '-preset', 'medium',
      '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', presentation]);
    console.log(`\nFinished. Videos saved in:\n${root}\n\nPresentation: ${presentation}`);
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
