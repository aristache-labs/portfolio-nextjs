import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ReactNode } from "react";
import { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { AnalyticsPreferences } from "@/components/analytics/AnalyticsPreferences";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { HashScrollFix } from "@/components/util/HashScrollFix";
import { AmbientBackground } from "@/components/background/AmbientBackground";
import { PersonJsonLd, WebSiteJsonLd } from "@/lib/seo/jsonld";
import { SITE } from "@/lib/seo/site";
import MyStatsig from "./my-statsig";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: [
    SITE.name,
    "aristache-labs",
    "technical team lead",
    "automation engineer",
    "mobile developer",
    "web developer",
    "react native",
    "react",
    "next.js",
  ],
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
    creator: SITE.handle,
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
        {/* Applies the stored palette before paint, or the page shows the default for a frame
            and snaps. The default is the ABSENCE of the attribute, hence no else branch. Key
            duplicates PALETTE_STORAGE_KEY in lib/palettes.ts. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var p=localStorage.getItem('palette');" +
              "if(p==='magenta'){localStorage.setItem('palette','obsidian');p='obsidian';}" +
              "if(p&&['iris','glacier','ember','verdant'].indexOf(p)>-1)" +
              "document.documentElement.dataset.palette=p}catch(e){}",
          }}
        />
      </head>
      <body className={GeistSans.className}>
        <MyStatsig>
          <PersonJsonLd />
          <WebSiteJsonLd />
          <MotionProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {/* Inside ThemeProvider: the canvas reads resolvedTheme for its blend mode.
                  The palette needs no provider - usePalette is an external-store hook. */}
              <AmbientBackground />
              <main>{children}</main>
              <ScrollToTop />
              <AnalyticsPreferences />
            </ThemeProvider>
          </MotionProvider>
          <HashScrollFix />
          <VercelAnalytics />
          <SpeedInsights />
          <GoogleAnalytics />
        </MyStatsig>
      </body>
    </html>
  );
};

export default RootLayout;
