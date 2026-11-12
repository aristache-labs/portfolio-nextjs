import "./globals.css";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GeistSans } from "geist/font/sans";
import { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import { DeferredControls } from "@/components/common/DeferredControls";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { HashScrollFix } from "@/components/util/HashScrollFix";
import { LateMonoFont } from "@/components/util/LateMonoFont";
import { SectionRenderBudget } from "@/components/common/SectionRenderBudget";
import { AmbientBackgroundGate } from "@/components/background/AmbientBackgroundGate";
import { PersonJsonLd, WebSiteJsonLd } from "@/lib/seo/jsonld";
import { SITE } from "@/lib/seo/site";
// Read at module initialization, including on dynamic routes. next.config.js includes this
// runtime asset in server traces. Portrait homepage chunks wait for the hero poster via this gate.
const POSTER_SCRIPT_GATE = readFileSync(
  join(process.cwd(), "scripts/poster-script-gate.js"),
  "utf8",
);

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.name, url: new URL("/", SITE.url).toString() }],
  creator: SITE.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: new URL("/", SITE.url).toString(),
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    locale: "en_US",
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_TOKEN
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION_TOKEN,
        },
      }
    : {}),
};

// viewport-fit=cover lets the page draw under the notch in landscape. Without it, iOS
// letterboxes the page and leaves a black strip. site-container pads for the safe area.
export const viewport: Viewport = { viewportFit: "cover" };

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      // Obsidian dark on every route. Static, so no OS preference or stored choice can switch
      // a route to light. `dark` keeps the `dark:` variant working; tokens live in :root.
      className={`dark ${GeistSans.variable}`}
    >
      <head>
        <script id="poster-script-gate" dangerouslySetInnerHTML={{ __html: POSTER_SCRIPT_GATE }} />
      </head>
      <body className={GeistSans.className}>
        <PersonJsonLd />
        <WebSiteJsonLd />
        <MotionProvider>
          <SectionRenderBudget />
          <AmbientBackgroundGate />
          <main>{children}</main>
          <DeferredControls />
        </MotionProvider>
        <HashScrollFix />
        <LateMonoFont />
        <GoogleAnalytics />
      </body>
    </html>
  );
};

export default RootLayout;
