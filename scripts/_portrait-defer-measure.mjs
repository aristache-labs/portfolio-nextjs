import { spawn } from "node:child_process";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const port = 4100;
const origin = `http://127.0.0.1:${port}`;

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor((sorted.length - 1) / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid] + sorted[mid + 1]) / 2;
}

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
child.stdout.on("data", (chunk) => {
  log += chunk;
});
child.stderr.on("data", (chunk) => {
  log += chunk;
});

async function ready() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(log.slice(-400));
    try {
      const response = await fetch(origin);
      if (response.ok) return await response.text();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error("server did not start");
}

const browser = await chromium.launch();
try {
  const html = await ready();
  const eager = (html.match(/<script\b[^>]*\ssrc="\/_next\/static\/chunks\//g) || []).length;
  const held = (html.match(/data-poster-src="\/_next\/static\/chunks\//g) || []).length;
  const gate = html.includes('id="poster-script-gate"');
  console.log(JSON.stringify({ eager, held, gate }));
  if (eager || !held || !gate) throw new Error("homepage HTML was not rewritten");

  const runs = [];
  for (let run = 1; run <= 5; run += 1) {
    const context = await browser.newContext({
      viewport: { width: 412, height: 823 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__lcp = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__lcp.push({ start: entry.startTime, url: entry.url, tag: entry.element ? entry.element.tagName : "" });
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    });
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: Math.round((1638.4 * 1024) / 8),
      uploadThroughput: Math.round((750 * 1024) / 8),
    });
    await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page.goto(origin, { waitUntil: "load", timeout: 45000 });
    const sample = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource");
      const poster = resources.find((entry) => entry.name.includes("hero-portrait"));
      const scripts = resources.filter((entry) => entry.name.includes("/_next/static/chunks/") && entry.name.includes(".js"));
      return {
        posterEnd: poster ? Math.round(poster.responseEnd) : null,
        lcp: window.__lcp.at(-1) ? Math.round(window.__lcp.at(-1).start) : null,
        lcpUrl: window.__lcp.at(-1) ? window.__lcp.at(-1).url : "",
        lcpTag: window.__lcp.at(-1) ? window.__lcp.at(-1).tag : "",
        earlyScripts: poster ? scripts.filter((entry) => entry.startTime + 30 < poster.responseEnd).length : scripts.length,
        scriptCount: scripts.length,
      };
    });
    runs.push({ run, ...sample });
    console.log(JSON.stringify({ run, ...sample }));
    await context.close();
  }
  console.log(
    JSON.stringify({
      medianPosterEnd: median(runs.map((row) => row.posterEnd)),
      medianLcp: median(runs.map((row) => row.lcp)),
      medianEarlyScripts: median(runs.map((row) => row.earlyScripts)),
    }),
  );
} finally {
  await browser.close();
  spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
}
