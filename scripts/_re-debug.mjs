import fs from "node:fs";
const html = fs.readFileSync(".next/server/app/index.html", "utf8");
const re = /(<script\b[^>]*?)\ssrc="(\/_next\/static\/chunks\/[^"]+)"/g;
const found = html.match(re);
console.log("found", found ? found.length : 0);
if (found) console.log(found[0].slice(0, 140));
const sample = '<script src="/_next/static/chunks/a.js" async="">';
console.log("sample", sample.replace(re, "$1 data-poster-src=\"$2\""));
