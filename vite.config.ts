import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'Mandarin Echo',
        short_name: 'Mandarin Echo',
        description: '中国語の発音を学ぶための学習アプリ',
        theme_color: '#3F9877',
        background_color: '#0f172a',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233F9877" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">M</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect fill="%233F9877" width="512" height="512"/><text x="50%" y="50%" font-size="280" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">M</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233F9877" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">M</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 540 720"><rect fill="%230f172a" width="540" height="720"/><rect fill="%233F9877" width="540" height="80"/><text x="270" y="40" font-size="32" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">Mandarin Echo</text></svg>',
            sizes: '540x720',
            type: 'image/svg+xml',
            form_factor: 'narrow'
          }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
})
