import { defineConfig } from '@vite-pwa/assets-generator/config'

// Genera los íconos de la PWA a partir de public/logo.svg:
//   npm run generate-pwa-assets
export default defineConfig({
  preset: {
    transparent: { sizes: [64, 192, 512], favicons: [[48, 'favicon.ico']], padding: 0 },
    maskable: { sizes: [512], padding: 0 },
    apple: { sizes: [180], padding: 0 },
  },
  images: ['public/logo.svg'],
})
