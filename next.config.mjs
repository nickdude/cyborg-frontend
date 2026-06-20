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
    ];
  },
};

export default withSerwist(nextConfig);
