import { defaultCache } from "@serwist/next/worker";
import {
  Serwist,
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
  ExpirationPlugin,
} from "serwist";

// Precache the build manifest, and ensure the offline fallback page is precached
// too (added only if the build didn't already include it) so the fallback below
// can actually be served on a cold, never-visited offline load.
const manifest = self.__SW_MANIFEST || [];
const hasOffline = manifest.some(
  (entry) => (typeof entry === "string" ? entry : entry.url) === "/offline"
);
const precacheEntries = hasOffline
  ? manifest
  : [...manifest, { url: "/offline", revision: null }];

const serwist = new Serwist({
  precacheEntries,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API calls — network first, fall back to cache.
    {
      matcher: /\/api\/.*/i,
      handler: new NetworkFirst({
        cacheName: "api-cache",
        networkTimeoutSeconds: 10,
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 60 * 60 })],
      }),
    },
    // Static assets (JS, CSS) — stale while revalidate.
    {
      matcher: /\/_next\/static\/.*/i,
      handler: new StaleWhileRevalidate({
        cacheName: "static-assets",
        plugins: [
          new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      }),
    },
    // Hero scroll-sequence frames — a large fixed set (~171 files) that must ALL
    // stay cached together. Dedicated bucket with a cap above the frame count so
    // the sequence never evicts itself. Listed before the generic image rule so
    // it wins the match for these URLs.
    {
      matcher: /\/assets\/hero-images\/.*/i,
      handler: new CacheFirst({
        cacheName: "hero-frames",
        plugins: [
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 }),
        ],
      }),
    },
    // Images — cache first.
    {
      matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: new CacheFirst({
        cacheName: "image-cache",
        plugins: [
          new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
        ],
      }),
    },
    // Fonts — cache first (rarely change).
    {
      matcher: /\.(?:woff|woff2|ttf|otf)$/i,
      handler: new CacheFirst({
        cacheName: "font-cache",
        plugins: [
          new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 }),
        ],
      }),
    },
    // Pages — network first for fresh content.
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({
        cacheName: "page-cache",
        networkTimeoutSeconds: 5,
        plugins: [
          new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
