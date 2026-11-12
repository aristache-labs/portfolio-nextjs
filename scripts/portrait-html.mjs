/**
 * Turns the chunk scripts of the prerendered home page into held ones (`data-poster-src`) and puts
 * the portrait poster gate in front of them. Used by the post-build script (local builds) and by
 * the build adapter (Vercel, where the adapter owns the output). Pure: HTML in, HTML out.
 */
export function deferPortraitHtml(source, gate) {
  let html = source.replace(
    /(<script\b[^>]*?)\ssrc="(\/_next\/static\/chunks\/[^"]+)"/g,
    '$1 data-poster-src="$2"',
  );
  html = html.replace(
    /(<link\b[^>]*\bas="script"[^>]*?)\shref="(\/_next\/static\/chunks\/[^"]+)"/g,
    '$1 data-poster-src="$2"',
  );

  if (!html.includes('id="poster-script-gate"')) {
    const marker = '<link rel="preload" as="script"';
    if (!html.includes(marker)) throw new Error("script preload was not found");
    html = html.replace(marker, `<script id="poster-script-gate">${gate.trim()}</script>${marker}`);
  }

  const leftScripts = html.match(/<script\b[^>]*\ssrc="\/_next\/static\/chunks\//g);
  const leftLinks = html.match(/<link\b[^>]*\bas="script"[^>]*\shref="\/_next\/static\/chunks\//g);
  if (leftScripts || leftLinks) {
    throw new Error(
      "chunk urls still eager: scripts " +
        (leftScripts ? leftScripts.length : 0) +
        ", links " +
        (leftLinks ? leftLinks.length : 0),
    );
  }

  const held = html.match(/data-poster-src="\/_next\/static\/chunks\//g);
  return { html, held: held ? held.length : 0 };
}
