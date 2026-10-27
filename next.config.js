// Keep the report-only image allowlist aligned with next/image, including wildcard apex hosts.
const remoteImagePatterns = [
  { protocol: "https", hostname: "**.githubusercontent.com" },
  { protocol: "https", hostname: "**.github.com" },
  { protocol: "https", hostname: "**.amazonaws.com" },
  // Avatar and project images uploaded to Vercel Blob.
  { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
  // Seeded avatar is an absolute URL on NEXT_PUBLIC_SITE_URL. Local dev is http://localhost.
  { protocol: "http", hostname: "localhost" },
  // The same absolute avatar on the deployed site. Without this, next/image returns 400.
  { protocol: "https", hostname: "portfolio-nextjs-aristache-projects.vercel.app" },
];

const isDev = process.env.NODE_ENV === "development";
const imageSources = remoteImagePatterns.flatMap(({ protocol, hostname }) => {
  const host = hostname.replace("**.", "*.");
  const source = `${protocol}://${host}${protocol === "http" ? ":*" : ""}`;
  return hostname.startsWith("**.") ? [source, `${protocol}://${hostname.slice(3)}`] : [source];
});

// No nonce: the homepage must retain static rendering and its 12h ISR window.
// Reports are visible in browser diagnostics; no report collector is configured yet.
const reportOnlyCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://img.shields.io ${imageSources.join(" ")}`,
  "font-src 'self'",
  "media-src 'self'",
  // Analytics, contact, auth and Blob uploads all use same-origin browser requests.
  `connect-src 'self'${isDev ? " ws://localhost:* ws://127.0.0.1:*" : ""}`,
  "form-action 'self' https://github.com",
  "frame-ancestors 'none'",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // LAN device hitting the dev server (HMR /_next/webpack-hmr). Dev-only.
  allowedDevOrigins: ["192.168.1.103"],
  // sharp is a native addon used server-side (avatar and project image
  // optimization in src/lib/blob.ts). Mark it external so Next loads it via a
  // plain require from node_modules at runtime instead of letting Turbopack
  // rewrite it into a hashed external module it cannot dlopen on Vercel
  // (see vercel/next.js#86866).
  serverExternalPackages: ["sharp"],
  experimental: {
    // One stylesheet per entry instead of the default merged chunks: the homepage blocks on two
    // CSS files instead of five, and stops downloading Privacy's styles. Measured on a throttled
    // phone profile: LCP 2.31s -> 2.19s. "strict" made six files and was slower.
    cssChunking: false,
  },
  // Do not redirect www -> apex here. Vercel already redirects aristache.dev to
  // www.aristache.dev. Adding the opposite redirect makes the two hosts loop.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
        ],
      },
      ...["media", "brand", "fonts", "icons", "pwa"].map((directory) => ({
        source: `/${directory}/:path*`,
        headers: [
          { key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" },
        ],
      })),
    ];
  },

  async rewrites() {
    // Existing database rows may still name covers converted to WebP. Real public files win.
    return {
      afterFiles: [
        { source: "/brand/:file.png", destination: "/brand/:file.webp" },
        { source: "/brand/:file.jpg", destination: "/brand/:file.webp" },
      ],
    };
  },
  images: {
    // 75 is the default for the About portrait; 90 cost ~52 KB more with no visible gain at 2x.
    qualities: [75, 90],
    remotePatterns: remoteImagePatterns,
  },
};

module.exports = nextConfig;
