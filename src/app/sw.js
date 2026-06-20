import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // API calls — network first, fall back to cache
    {
      urlPattern: /\/api\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Static assets (JS, CSS) — stale while revalidate
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "static-assets",
        expiration: {
          maxEntries: 128,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Hero scroll-sequence frames — a large fixed set (~171 files) that must
    // ALL stay cached together. Dedicated bucket with a cap above the frame
    // count so the sequence never evicts itself (the previous shared 100-entry
    // image cache thrashed on every refresh, re-downloading frames). Listed
    // before the generic image rule so it wins the match for these URLs.
    {
      urlPattern: /\/assets\/hero-images\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "hero-frames",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
        },
      },
    },
    // Images — cache first
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Fonts — cache first (rarely change)
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "font-cache",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Pages — network first for fresh content
    {
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkFirst",
      options: {
        cacheName: "page-cache",
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
        networkTimeoutSeconds: 5,
      },
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
