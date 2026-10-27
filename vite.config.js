import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/parlo-app/"); "/" locally.
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  base,
  build: { chunkSizeWarningLimit: 1500 },
  plugins: [
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icons/apple-touch-icon.png", "icons/favicon.svg"],
      manifest: {
        name: "Parlo Italiano",
        short_name: "Parlo",
        description: "Learn Italian from A1 to B2: 3,000+ words, 320 verbs and 400+ phrases with spaced repetition.",
        lang: "en",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        background_color: "#f7f8f6",
        theme_color: "#1d6b52",
        categories: ["education"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "index.html",
        runtimeCaching: [
          {
            // Recorded voices: kept once played, so listening works offline afterwards.
            urlPattern: ({ url }) => url.pathname.startsWith("/parlo-audio/"),
            handler: "CacheFirst",
            options: { cacheName: "parlo-audio", expiration: { maxEntries: 4000 }, cacheableResponse: { statuses: [200] }, rangeRequests: true }
          },
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 20 } }
          }
        ]
      }
    })
  ]
});
