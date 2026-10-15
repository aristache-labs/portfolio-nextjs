/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // LAN device hitting the dev server (HMR /_next/webpack-hmr). Dev-only.
  allowedDevOrigins: ["192.168.1.108"],
  // sharp is a native addon used server-side (testimonial/avatar image
  // optimization in src/lib/blob.ts). Mark it external so Next loads it via a
  // plain require from node_modules at runtime instead of letting Turbopack
  // rewrite it into a hashed external module it cannot dlopen on Vercel
  // (see vercel/next.js#86866).
  serverExternalPackages: ["sharp"],
  // Do not redirect www -> apex here. Vercel already redirects aristache.dev to
  // www.aristache.dev. Adding the opposite redirect makes the two hosts loop.
  images: {
    // 90 for the About portrait: it renders large enough that the default 75 shows artefacts.
    qualities: [75, 90],
    remotePatterns: [
      { protocol: "https", hostname: "**.githubusercontent.com" },
      { protocol: "https", hostname: "**.github.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      // Avatar + testimonial images uploaded to Vercel Blob.
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      // Seeded avatar is an absolute URL on NEXT_PUBLIC_SITE_URL. Local dev is http://localhost.
      { protocol: "http", hostname: "localhost" },
      // The same absolute avatar on the deployed site. Without this, next/image returns 400.
      { protocol: "https", hostname: "portfolio-nextjs-aristache-projects.vercel.app" },
    ],
  },
};

module.exports = nextConfig;
