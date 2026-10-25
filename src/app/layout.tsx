import "./globals.css";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";
import { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { HashScrollFix } from "@/components/util/HashScrollFix";
import { AmbientBackgroundGate } from "@/components/background/AmbientBackgroundGate";
import { PersonJsonLd, WebSiteJsonLd } from "@/lib/seo/jsonld";
import { SITE } from "@/lib/seo/site";

// Use the package's exact font and fallback settings, without its default preload.
const GeistMono = localFont({
  src: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  variable: "--font-geist-mono",
  preload: false,
  adjustFontFallback: false,
  fallback: [
    "ui-monospace",
    "SFMono-Regular",
    "Roboto Mono",
    "Menlo",
    "Monaco",
    "Liberation Mono",
    "DejaVu Sans Mono",
    "Courier New",
    "monospace",
  ],
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  authors: [{ name: SITE.name, url: SITE.url }],
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
    url: SITE.url,
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

const ScrollToTop = dynamic(() => import("@/components/common/ScrollToTop"));

const RootLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        {/* Match the portrait hero's screen floor before its first paint, so hydration
            does not resize the cover image and visibly change its crop. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(matchMedia('(pointer: coarse) and (max-width: 767px) and (orientation: portrait)').matches){document.documentElement.style.setProperty('--portrait-screen-height',screen.height+'px')}",
          }}
        />
        {/* Without this, the initial system-theme flip animates through every element's own
            transition-* and reads as a flicker. globals.css suppresses transitions until
            `theme-ready`; blocking and in <head> so no unguarded frame exists. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "requestAnimationFrame(function(){document.documentElement.classList.add('theme-ready')})",
          }}
        />
        {/* Every route is Obsidian, which is the ABSENCE of data-palette. Drops a choice left
            by the removed picker before usePalette reads it, so no consumer can re-apply it.
            Key duplicates PALETTE_STORAGE_KEY in lib/palettes.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{localStorage.removeItem('palette')}catch(e){}",
          }}
        />
      </head>
      <body className={GeistSans.className}>
        <PersonJsonLd />
        <WebSiteJsonLd />
        <MotionProvider>
          {/* Obsidian dark on every route. Forced, so neither the OS preference nor a theme
              stored by the removed picker can switch a route to light. */}
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            forcedTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {/* Inside ThemeProvider: the canvas reads resolvedTheme for its blend mode.
                  The palette needs no provider - usePalette is an external-store hook. */}
            <AmbientBackgroundGate />
            <main>{children}</main>
            <ScrollToTop />
          </ThemeProvider>
        </MotionProvider>
        <HashScrollFix />
        <VercelAnalytics />
      </body>
    </html>
  );
};

export default RootLayout;
