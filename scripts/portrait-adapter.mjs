/**
 * Next build adapter for Vercel builds. Vercel sets NEXT_ADAPTER_PATH, and its adapter moves the
 * prerendered HTML into the deployment output inside `next build`, so a script that runs after the
 * build no longer finds `.next/server/app/index.html`. This adapter wraps that one: it defers the
 * portrait scripts of the home page HTML first, then hands over to the original adapter.
 *
 * next.config.js enables it only when NEXT_ADAPTER_PATH is set, so local builds are unchanged.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const thisFile = fileURLToPath(import.meta.url);

let innerPromise;
function loadInner() {
  innerPromise ??= (async () => {
    const innerPath = process.env.NEXT_ADAPTER_PATH;
    if (!innerPath || path.resolve(innerPath) === thisFile) return null;
    const mod = await import(pathToFileURL(path.resolve(innerPath)).href);
    return mod.default ?? mod;
  })();
  return innerPromise;
}

async function deferHomePage(context) {
  const home = (context.outputs?.prerenders ?? []).find(
    (output) => output.pathname === "/" && output.fallback?.filePath?.endsWith(".html"),
  );
  if (!home) {
    console.warn("portrait-adapter: no prerendered HTML for / in the build outputs; skipped");
    return;
  }
  const file = home.fallback.filePath;
  try {
    const { deferPortraitHtml } = await import(
      pathToFileURL(path.join(context.projectDir, "scripts/portrait-html.mjs")).href
    );
    const gate = fs.readFileSync(
      path.join(context.projectDir, "scripts/poster-script-gate.js"),
      "utf8",
    );
    const { html, held } = deferPortraitHtml(fs.readFileSync(file, "utf8"), gate);
    fs.writeFileSync(file, html);
    console.log("portrait-adapter: held chunk urls: " + held + " (" + file + ")");
  } catch (error) {
    // A page that is still served without the deferral beats a failed deploy.
    console.warn("portrait-adapter: portrait scripts NOT deferred: " + (error && error.message));
  }
}

export default {
  name: "portrait-scripts",
  async modifyConfig(config, context) {
    const inner = await loadInner();
    return inner?.modifyConfig ? inner.modifyConfig(config, context) : config;
  },
  async onBuildComplete(context) {
    await deferHomePage(context);
    const inner = await loadInner();
    if (inner?.onBuildComplete) await inner.onBuildComplete(context);
  },
};
