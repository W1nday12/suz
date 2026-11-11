import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const isApp = process.env.APP_BUILD === '1'
const base = isApp ? './' : '/suz/'

export default defineConfig({
  base,
  plugins: [
    react(),
    ...(isApp
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'ornament.svg'],
            manifest: {
              name: 'Сүз — татарча өйрән',
              short_name: 'Сүз',
              description:
                'Татар телен уйнап өйрән: 12 юнит, 300 сүз һәм җөмләләр. Көн саен кыска дәресләр.',
              lang: 'ru',
              dir: 'ltr',
              theme_color: '#0E6B4F',
              background_color: '#FBF6EA',
              display: 'standalone',
              orientation: 'portrait',
              start_url: base,
              scope: base,
              categories: ['education', 'productivity'],
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icons/icon-maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,svg,png,woff2,ttf}'],
              navigateFallback: `${base}index.html`,
              cleanupOutdatedCaches: true,
              clientsClaim: true,
              skipWaiting: true,
            },
            devOptions: { enabled: false },
          }),
        ]),
  ],
  server: { host: true, port: 5173 },
})
