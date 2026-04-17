/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tolerate useSearchParams and similar client hooks during build-time
  // prerendering. Pages bail out to client rendering at runtime.
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
