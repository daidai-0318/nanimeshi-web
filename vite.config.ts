import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'なにめし',
        short_name: 'なにめし',
        description: '冷蔵庫の中身や気分からレシピを提案',
        theme_color: '#FF6B35',
        background_color: '#FFF8F0',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ja',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
