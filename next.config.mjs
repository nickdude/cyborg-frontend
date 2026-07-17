import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.js",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // The ported landing components are TypeScript brought into a JS app; don't let
  // type/lint noise block builds (dev type-checks still surface in the editor).
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    // Rewrite barrel imports to direct file imports for heavy libraries the
    // default list doesn't cover — cuts hundreds of modules per dev compile.
    optimizePackageImports: ["recharts", "motion", "framer-motion", "three"],
  },
  async headers() {
    return [
      {
        // Hero scroll-sequence frames are content-stable (filenames never
        // change in place), so they can be cached immutably by the browser
        // and any CDN/edge — eliminating per-refresh revalidation requests.
        source: "/assets/hero-images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Background videos are large and content-stable, so cache them hard:
        // the first (slow) visit is the only download — every later visit serves
        // the video instantly from the browser cache.
        source: "/videos/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
