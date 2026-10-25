import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "@/lib/seo/site";
import { BRAND, GROUND, INK } from "@/lib/brand";

export const runtime = "nodejs";
export const alt = SITE.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "src/app/icon.png"));
  const displayHost = new URL(SITE.url).host;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 72px",
        background: GROUND.dark,
        color: INK.dark,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* Local PNG keeps image generation independent of external asset requests. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${logo.toString("base64")}`}
          alt=""
          width={80}
          height={80}
          style={{ borderRadius: 18 }}
        />
        <span style={{ fontSize: 25, letterSpacing: 7, color: BRAND.bright }}>ARISTACHE</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 68, fontWeight: 700, letterSpacing: -2 }}>
          {SITE.name}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 40,
            lineHeight: 1.2,
            color: BRAND.bright,
            marginTop: 20,
          }}
        >
          {SITE.headline}
        </div>
        <div style={{ fontSize: 25, color: "#b8c5c5", marginTop: 24 }}>{SITE.positioning}</div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${BRAND.deep}`,
          paddingTop: 24,
        }}
      >
        <span style={{ fontSize: 23 }}>{SITE.jobTitle}</span>
        <span style={{ fontSize: 22, color: BRAND.bright }}>{displayHost}</span>
      </div>
    </div>,
    { ...size },
  );
}
