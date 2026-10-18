import { chromium, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

// ============================================================
// ARISTACHE — RESPONSIVE FULL-PAGE SCREENSHOT GENERATOR
// ============================================================

const CONFIG = {
  url: "http://localhost:4000",
  output: "screenshots/responsive",

  // "recommended" or "all"
  mode: "recommended",

  // Enable or disable device categories
  desktop: true,
  laptops: true,
  tablets: true,
  phones: true,

  // Capture both orientations on phones and tablets
  portrait: true,
  landscape: true,

  // Full-page screenshots only
  fullPage: true,

  // Use CSS pixels to keep image sizes manageable
  screenshotScale: "css",

  // Delay at each scroll position for lazy content
  scrollDelay: 120,

  // Delay after returning to the top
  settleDelay: 700,
};

// ============================================================
// DESKTOP & LAPTOP VIEWPORTS
// ============================================================

const desktopSizes = [
  { name: "desktop-full-hd", width: 1920, height: 1080 },
  { name: "desktop-large", width: 1600, height: 900 },
  { name: "desktop-standard", width: 1440, height: 900 },
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "desktop-2k", width: 2560, height: 1440 },
];

const laptopSizes = [
  { name: "laptop-1280", width: 1280, height: 800 },
  { name: "laptop-1366", width: 1366, height: 768 },
  { name: "laptop-1440", width: 1440, height: 900 },
];

// ============================================================
// RESPONSIVE BREAKPOINT COVERAGE
// These complement the built-in Playwright device profiles.
// ============================================================

const phoneSizes = [
  { name: "phone-320", width: 320, height: 568 },
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-375", width: 375, height: 812 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-412", width: 412, height: 915 },
  { name: "phone-430", width: 430, height: 932 },
];

const tabletSizes = [
  { name: "tablet-600", width: 600, height: 960 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "tablet-800", width: 800, height: 1280 },
  { name: "tablet-820", width: 820, height: 1180 },
  { name: "tablet-1024", width: 1024, height: 1366 },
];

// ============================================================
// PLAYWRIGHT DEVICE PROFILES
// Missing profiles are skipped automatically.
// ============================================================

const recommendedPhones = [
  "iPhone SE",
  "iPhone 13 mini",
  "iPhone 14",
  "iPhone 15",
  "iPhone 15 Pro",
  "iPhone 15 Pro Max",
  "Pixel 5",
  "Pixel 7",
  "Galaxy S9+",
];

const recommendedTablets = [
  "iPad Mini",
  "iPad (gen 7)",
  "iPad Pro 11",
  "iPad Pro 12.9",
  "Galaxy Tab S4",
];

// ============================================================
// HELPERS
// ============================================================

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function rotateContext(options) {
  return {
    ...options,
    viewport: {
      width: options.viewport.height,
      height: options.viewport.width,
    },
    ...(options.screen && {
      screen: {
        width: options.screen.height,
        height: options.screen.width,
      },
    }),
  };
}

function getDeviceOptions(name) {
  const preset = devices[name];

  if (!preset) {
    console.warn(`Skipping unavailable preset: ${name}`);
    return null;
  }

  // Chrome is used for every capture.
  // Remove browser-specific recommendations.
  const context = { ...preset };
  delete context.defaultBrowserType;

  return context;
}

function addOrientations(targets, name, context, category) {
  if (CONFIG.portrait) {
    targets.push({
      name: `${name}-portrait`,
      category,
      context,
    });
  }

  if (CONFIG.landscape) {
    targets.push({
      name: `${name}-landscape`,
      category,
      context: rotateContext(context),
    });
  }
}

function addManualSizes(targets, sizes, category) {
  for (const item of sizes) {
    const context = {
      viewport: {
        width: item.width,
        height: item.height,
      },
      isMobile: category === "phones",
      hasTouch: true,
      deviceScaleFactor: 1,
    };

    addOrientations(targets, item.name, context, category);
  }
}

function addPlaywrightPresets(targets, names, category) {
  for (const name of names) {
    const context = getDeviceOptions(name);
    if (!context) continue;

    addOrientations(targets, `device-${slug(name)}`, context, category);
  }
}

function getAllDeviceNames(category) {
  return Object.keys(devices).filter((name) => {
    if (/landscape/i.test(name)) return false;

    if (category === "tablets") {
      return /iPad|Galaxy Tab|Nexus (7|9|10)/i.test(name);
    }

    return (
      /iPhone|Pixel|Galaxy|Nexus|Moto|Lumia|BlackBerry/i.test(name) && !/Galaxy Tab/i.test(name)
    );
  });
}

// ============================================================
// BUILD TARGET LIST
// ============================================================

function buildTargets() {
  const targets = [];

  if (CONFIG.desktop) {
    for (const item of desktopSizes) {
      targets.push({
        name: item.name,
        category: "desktop",
        context: {
          viewport: {
            width: item.width,
            height: item.height,
          },
          deviceScaleFactor: 1,
        },
      });
    }
  }

  if (CONFIG.laptops) {
    for (const item of laptopSizes) {
      targets.push({
        name: item.name,
        category: "laptops",
        context: {
          viewport: {
            width: item.width,
            height: item.height,
          },
          deviceScaleFactor: 1,
        },
      });
    }
  }

  if (CONFIG.phones) {
    addManualSizes(targets, phoneSizes, "phones");

    const names = CONFIG.mode === "all" ? getAllDeviceNames("phones") : recommendedPhones;

    addPlaywrightPresets(targets, names, "phones");
  }

  if (CONFIG.tablets) {
    addManualSizes(targets, tabletSizes, "tablets");

    const names = CONFIG.mode === "all" ? getAllDeviceNames("tablets") : recommendedTablets;

    addPlaywrightPresets(targets, names, "tablets");
  }

  return targets;
}

// ============================================================
// SCROLL THROUGH PAGE TO ACTIVATE LAZY CONTENT
// ============================================================

async function prepareFullPage(page) {
  await page.evaluate(async (scrollDelay) => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const step = Math.max(250, Math.floor(window.innerHeight * 0.8));

    let position = 0;

    while (position < document.documentElement.scrollHeight) {
      window.scrollTo({
        top: position,
        behavior: "instant",
      });

      await delay(scrollDelay);
      position += step;
    }

    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "instant",
    });

    await delay(300);

    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, CONFIG.scrollDelay);

  await page.waitForTimeout(CONFIG.settleDelay);

  await page.evaluate(async () => {
    await document.fonts.ready;

    const images = Array.from(document.images);

    await Promise.all(
      images.map((img) =>
        img.complete
          ? Promise.resolve()
          : Promise.race([
              img.decode().catch(() => {}),
              new Promise((resolve) => setTimeout(resolve, 3000)),
            ]),
      ),
    );
  });
}

// ============================================================
// SCREENSHOT
// ============================================================

async function captureTarget(browser, target) {
  const context = await browser.newContext({
    ...target.context,

    // Always use Dark Mode
    colorScheme: "dark",

    // Preserve stable animations for screenshots
    reducedMotion: "reduce",
  });

  // Set the theme BEFORE loading the website
  await context.addInitScript(() => {
    localStorage.setItem("theme", "dark");

    // Default Aristache Obsidian palette
    localStorage.removeItem("palette");
  });

  try {
    const page = await context.newPage();

    await page.goto(CONFIG.url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait until next-themes applies Dark Mode
    await page.waitForFunction(() => document.documentElement.classList.contains("dark"), null, {
      timeout: 10000,
    });

    // Debug theme configuration
    const themeInfo = await page.evaluate(() => ({
      theme: localStorage.getItem("theme"),
      rootClass: document.documentElement.className,
      background: getComputedStyle(document.documentElement).getPropertyValue("--bg").trim(),
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
    }));

    console.log(`[${target.name}] Theme:`, themeInfo);

    await page
      .waitForLoadState("load", {
        timeout: 15000,
      })
      .catch(() => {});

    // Hide the Next.js development overlay and
    // disable smooth scrolling during capture.
    await page.addStyleTag({
      content: `
        nextjs-portal {
          display: none !important;
          visibility: hidden !important;
        }

        html {
          scroll-behavior: auto !important;
        }
      `,
    });

    await prepareFullPage(page);

    const directory = path.join(CONFIG.output, target.category);

    await mkdir(directory, { recursive: true });

    const filename = `${target.name}-full.png`;
    const filepath = path.join(directory, filename);

    await page.screenshot({
      path: filepath,
      fullPage: CONFIG.fullPage,
      animations: "disabled",
      caret: "hide",
      scale: CONFIG.screenshotScale,
      timeout: 60000,
    });

    const viewport = page.viewportSize();

    console.log(`✓ ${target.name} (${viewport?.width}x${viewport?.height})`);

    return { name: target.name, success: true };
  } catch (error) {
    console.error(`✗ ${target.name}: ${error.message}`);

    return { name: target.name, success: false };
  } finally {
    await context.close();
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  await mkdir(CONFIG.output, { recursive: true });

  const targets = buildTargets();

  console.log("\nARISTACHE RESPONSIVE SCREENSHOTS");
  console.log(`Mode: ${CONFIG.mode}`);
  console.log(`Devices / viewports: ${targets.length}`);
  console.log(`URL: ${CONFIG.url}`);
  console.log(`Output: ${CONFIG.output}\n`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const results = [];

  try {
    for (const [index, target] of targets.entries()) {
      console.log(`[${index + 1}/${targets.length}] ${target.name}`);

      results.push(await captureTarget(browser, target));
    }
  } finally {
    await browser.close();
  }

  const passed = results.filter((r) => r.success).length;
  const failed = results.length - passed;

  console.log("\n==================================");
  console.log("SCREENSHOT GENERATION COMPLETE");
  console.log(`Successful: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${results.length}`);
  console.log(`Folder: ${CONFIG.output}`);
  console.log("==================================\n");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

await main();
