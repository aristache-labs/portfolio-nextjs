import { spawn } from "node:child_process";
import fs from "node:fs";
import { chromium } from "playwright";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const port = 4100;
const origin = `http://127.0.0.1:${port}`;
const targets = [
  ".next/server/app/index.html",
  ".next/server/chunks/4261.js",
  ".next/static/chunks/7326-49957b6f3b8f6334.js",
].map((rel) => ({ rel, abs: `${root}/${rel}`.replaceAll("/", "\\") }));

const swaps = [
  [
    'as="image" fetchPriority="high" imageSrcSet="/brand/aristache-text-224.webp',
    'as="image" fetchPriority="low" imageSrcSet="/brand/aristache-text-224.webp',
  ],
  [
    'min(42vw, 224px)" fetchPriority="high" style="aspect-ratio:704 / 124"',
    'min(42vw, 224px)" fetchPriority="low" style="aspect-ratio:704 / 124"',
  ],
  ['imageSizes:P,fetchPriority:"high"}', 'imageSizes:P,fetchPriority:"low"}'],
  ['imageSizes:J,fetchPriority:"high"}', 'imageSizes:J,fetchPriority:"low"}'],
  [
    'fetchPriority:"high",style:{aspectRatio:"704 / 124"}',
    'fetchPriority:"low",style:{aspectRatio:"704 / 124"}',
  ],
];

const originals = new Map(targets.map((file) => [file.abs, fs.readFileSync(file.abs)]));

function count(needle) {
  let total = 0;
  for (const bytes of originals.values()) total += bytes.toString("utf8").split(needle).length - 1;
  return total;
}

for (const [from] of swaps) {
  const total = count(from);
  const perFile = [...originals.values()].map((bytes) => bytes.toString("utf8").split(from).length - 1);
  if (total < 1 || perFile.some((matches) => matches > 1)) {
    throw new Error(`${total} matches for ${from.slice(0, 60)}`);
  }
}

function writeVariant(low) {
  for (const file of targets) {
    if (!low) {
      fs.writeFileSync(file.abs, originals.get(file.abs));
      continue;
    }
    let text = originals.get(file.abs).toString("utf8");
    for (const [from, to] of swaps) {
      if (!text.includes(from)) continue;
      text = text.replace(from, to);
    }
    fs.writeFileSync(file.abs, text);
  }
}

function restore() {
  for (const [abs, bytes] of originals) fs.writeFileSync(abs, bytes);
}

function assertServed(html, low) {
  const hint = low ? "low" : "high";
  const wordmark = `fetchPriority="${hint}" imageSrcSet="/brand/aristache-text-224.webp`;
  const poster = 'href="/media/hero-portrait.webp" as="image" fetchPriority="high"';
  if (!html.includes(wordmark)) throw new Error(`served wordmark is not ${hint}`);
  if (!html.includes(poster)) throw new Error("poster preload is no longer high");
}

async function startServer() {
  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
    { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
  );
  let log = "";
  child.stdout.on("data", (chunk) => {
    log += chunk;
  });
  child.stderr.on("data", (chunk) => {
    log += chunk;
  });
  const deadline = Date.now() + 30000;
  let html = "";
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(log.slice(-500));
    try {
      const response = await fetch(origin);
      if (response.ok) {
        html = await response.text();
        break;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  if (!html) throw new Error(`server did not start\n${log.slice(-500)}`);
  return { child, html };
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    try {
      await fetch(origin);
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
}

async function measure(browser) {
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
      const image = document.querySelector('img[src*="aristache-text"], img[srcset*="aristache-text"]');
      for (const entry of list.getEntries()) {
        window.__lcp.push({
          start: entry.startTime,
          url: entry.url,
          tag: entry.element ? entry.element.tagName : "",
          logoReady: Boolean(image && image.complete && image.naturalWidth > 0),
        });
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  const client = await context.newCDPSession(page);
  const requests = new Map();
  client.on("Network.requestWillBeSent", (event) => {
    const url = event.request.url;
    if (!url.includes("hero-portrait") && !url.includes("aristache-text")) return;
    requests.set(event.requestId, { url, priority: event.request.initialPriority });
  });
  client.on("Network.resourceChangedPriority", (event) => {
    const row = requests.get(event.requestId);
    if (row) row.priority = event.newPriority;
  });
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
  const pageMetrics = await page.evaluate(() => {
    const resources = performance.getEntriesByType("resource").filter((entry) => {
      return entry.name.includes("hero-portrait") || entry.name.includes("aristache-text");
    });
    return {
      resources: resources.map((entry) => ({
        name: entry.name,
        start: Math.round(entry.startTime),
        end: Math.round(entry.responseEnd),
        size: entry.transferSize,
      })),
      lcp: window.__lcp.at(-1) ?? null,
    };
  });
  await context.close();
  return { ...pageMetrics, requests: [...requests.values()] };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor((sorted.length - 1) / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid] + sorted[mid + 1]) / 2;
}

const runs = [];
const browser = await chromium.launch();
try {
  for (let pair = 1; pair <= 5; pair += 1) {
    for (const variant of ["high", "low"]) {
      writeVariant(variant === "low");
      const server = await startServer();
      try {
        assertServed(server.html, variant === "low");
        const sample = await measure(browser);
        const poster = sample.resources.find((row) => row.name.includes("hero-portrait"));
        const wordmark = sample.resources.find((row) => row.name.includes("aristache-text"));
        const row = {
          pair,
          variant,
          posterStart: poster?.start ?? null,
          posterEnd: poster?.end ?? null,
          posterSize: poster?.size ?? null,
          lcp: sample.lcp ? Math.round(sample.lcp.start) : null,
          lcpTag: sample.lcp?.tag ?? "",
          logoReadyAtLcp: sample.lcp?.logoReady ?? null,
          wordmarkStart: wordmark?.start ?? null,
          wordmarkEnd: wordmark?.end ?? null,
          wordmarkPriority: sample.requests
            .filter((item) => item.url.includes("aristache-text"))
            .map((item) => item.priority)
            .join(","),
          posterPriority: sample.requests.find((item) => item.url.includes("hero-portrait"))
            ?.priority ?? "",
        };
        runs.push(row);
        console.log(JSON.stringify(row));
      } finally {
        await stopServer(server.child);
      }
    }
  }
} finally {
  restore();
  await browser.close();
}

const high = runs.filter((row) => row.variant === "high");
const low = runs.filter((row) => row.variant === "low");
const pairDelta = (key) => high.map((row, index) => low[index][key] - row[key]);
console.log(
  JSON.stringify({
    medianPosterEndHigh: median(high.map((row) => row.posterEnd)),
    medianPosterEndLow: median(low.map((row) => row.posterEnd)),
    medianLcpHigh: median(high.map((row) => row.lcp)),
    medianLcpLow: median(low.map((row) => row.lcp)),
    medianWordmarkEndHigh: median(high.map((row) => row.wordmarkEnd)),
    medianWordmarkEndLow: median(low.map((row) => row.wordmarkEnd)),
    pairPosterDelta: pairDelta("posterEnd"),
    pairLcpDelta: pairDelta("lcp"),
    pairWordmarkDelta: pairDelta("wordmarkEnd"),
    medianPairPosterDelta: median(pairDelta("posterEnd")),
    medianPairLcpDelta: median(pairDelta("lcp")),
    medianPairWordmarkDelta: median(pairDelta("wordmarkEnd")),
  }),
);
