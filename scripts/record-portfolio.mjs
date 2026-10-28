import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Run: node record-portfolio.mjs
// Optional: PORTFOLIO_URL, CHROME_CHANNEL=chrome, FFMPEG_PATH, SCROLL_MULTIPLIER=2
// A larger multiplier gives visitors longer to see each section.
const url = process.env.PORTFOLIO_URL || 'https://www.aristache.dev';
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg';
const multiplier = Number(process.env.SCROLL_MULTIPLIER || 1);
const presentationFps = 30;
if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('SCROLL_MULTIPLIER must be positive.');
// Screen includes browser chrome; viewport is only the visible webpage.
const desktopScreen = { width: 1920, height: 1200 };
const mobileScreen = { width: 440, height: 956 };
function viewportHeight(name, fallback, screenHeight) {
  const height = Number(process.env[name] || fallback);
  if (!Number.isInteger(height) || height < 320 || height > screenHeight || height % 2 !== 0) {
    throw new Error(`${name} must be an even integer between 320 and ${screenHeight}.`);
  }
  return height;
}
const desktopViewport = {
  width: desktopScreen.width,
  height: viewportHeight('DESKTOP_VIEWPORT_HEIGHT', 1000, desktopScreen.height),
};
const mobileViewport = {
  width: mobileScreen.width,
  height: viewportHeight('MOBILE_VIEWPORT_HEIGHT', 852, mobileScreen.height),
};
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', 'screenshots/video');

function encode(args) {
  const result = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'warning', '-y', ...args], { stdio: 'inherit' });
  if (result.error) throw new Error(`Cannot start FFmpeg: ${result.error.message}. Install FFmpeg and restart your terminal.`);
  if (result.status !== 0) throw new Error(`FFmpeg failed (exit ${result.status}). Raw recordings remain in ${root}`);
}

async function capture(browser, name, viewport, scrollSeconds, mobile, screen, fps) {
  const context = await browser.newContext({
    viewport,
    screen,
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

    // Rewind the loaded hero after hydration, including completed fill-mode animations.
    await page.evaluate(() => {
      const marker = document.createElement('div');
      marker.id = 'recording-start-marker';
      marker.style.cssText = 'position:fixed;left:0;top:0;width:8px;height:8px;background:#ff00ff;z-index:2147483647;pointer-events:none';
      document.body.append(marker);
      for (const animation of document.querySelector('#hero')?.getAnimations({ subtree: true }) ?? []) {
        if (animation instanceof CSSAnimation) {
          animation.pause();
          animation.currentTime = 0;
        }
      }
    });
    await page.waitForTimeout(200);
    let start = (performance.now() - recordingEpoch) / 1000;
    await page.waitForTimeout(160);
    await page.evaluate(() => {
      for (const animation of document.querySelector('#hero')?.getAnimations({ subtree: true }) ?? []) {
        if (animation instanceof CSSAnimation) animation.play();
      }
      document.getElementById('recording-start-marker')?.remove();
    });
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
    const duration = (performance.now() - recordingEpoch) / 1000 - start;
    await context.close();
    const raw = path.join(root, `${name}-raw.webm`);
    await video.saveAs(raw);
    // Recorder timestamps begin at its first delivered frame, not page creation.
    // Locate the temporary marker in the actual video instead of using wall time.
    const probe = spawnSync(ffmpeg, ['-v', 'error', '-i', raw, '-vf',
      'fps=25,crop=8:8:0:0,format=rgb24', '-f', 'rawvideo', '-'], { maxBuffer: 16 * 1024 * 1024 });
    if (probe.error || probe.status !== 0) throw new Error('Cannot locate recording opening marker.');
    const bytesPerFrame = 8 * 8 * 3;
    let lastMarker = -1;
    for (let offset = 0; offset + bytesPerFrame <= probe.stdout.length; offset += bytesPerFrame) {
      let pixels = 0;
      for (let pixel = offset; pixel < offset + bytesPerFrame; pixel += 3) {
        if (probe.stdout[pixel] > 200 && probe.stdout[pixel + 1] < 70 && probe.stdout[pixel + 2] > 200) pixels++;
      }
      if (pixels > 48) lastMarker = offset / bytesPerFrame;
    }
    if (lastMarker < 0) throw new Error('Recording opening marker was not captured.');
    start = (lastMarker + 1) / 25;
    const output = path.join(root, `${name}.mp4`);
    console.log(`Exporting ${name} at ${fps} fps...`);
    encode(['-ss', String(start), '-i', raw, '-t', String(duration), '-an',
      '-vf', `fps=${fps},setsar=1`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18',
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
  async function recordLayout(name, viewport, seconds, mobile, screen, fps) {
    // Desktop screencasting drops frames in headless mode at this resolution.
    // Keep its visible window unobstructed while recording. Mobile stays headless.
    const browser = await chromium.launch({
      headless: mobile,
      ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}),
    });
    try {
      console.log(`Recording ${name}: viewport ${viewport.width} x ${viewport.height}...`);
      return await capture(browser, name, viewport, seconds, mobile, screen, fps);
    } finally {
      await browser.close();
    }
  }
  const desktop = await recordLayout('desktop', desktopViewport, 22, false, desktopScreen, 25);
  const mobile = await recordLayout('mobile', mobileViewport, 26, true, mobileScreen, 30);
    console.log('Building the combined presentation...');
    const presentation = path.join(root, 'aristache-presentation.mp4');
    const fade = (length) => `fade=t=in:st=0:d=0.35,fade=t=out:st=${Math.max(0, length - 0.35)}:d=0.35`;
    const filter = [
      `[0:v]setpts=PTS-STARTPTS,scale=1920:1200:force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1,pad=1920:1200:(ow-iw)/2:(oh-ih)/2:color=0x080c0d,${fade(desktop.duration)}[desktop]`,
      `[1:v]setpts=PTS-STARTPTS,scale=480:-2:flags=lanczos,setsar=1,pad=1920:1200:(ow-iw)/2:(oh-ih)/2:color=0x080c0d,${fade(mobile.duration)}[mobile]`,
      '[desktop][mobile]concat=n=2:v=1:a=0[out]',
    ].join(';');
    encode(['-i', desktop.output, '-i', mobile.output, '-filter_complex', filter,
      '-map', '[out]', '-an', '-r', String(presentationFps), '-c:v', 'libx264', '-preset', 'veryfast',
      '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', presentation]);
    console.log(`\nFinished. Videos saved in:\n${root}\n\nPresentation: ${presentation}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
