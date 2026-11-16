import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'apple-touch-icon-180x180.png'],
      workbox: {
        // Incluye las fotos de categorías para que la app se vea completa sin internet.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico,webmanifest}'],
      },
      manifest: {
        name: 'POS Víveres',
        short_name: 'POS Víveres',
        description: 'Punto de venta para tienda de víveres. Funciona sin internet.',
        lang: 'es',
        theme_color: '#F3F4F6',
        background_color: '#F3F4F6',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
