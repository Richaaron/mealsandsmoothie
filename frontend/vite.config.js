import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Culina World',
        short_name: 'Culina',
        description: 'Global Culinary Gastronomy Repository',
        theme_color: '#050505',
        background_color: '#050505',
        icons: [
          {
            src: 'public/favicon.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'public/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
})
