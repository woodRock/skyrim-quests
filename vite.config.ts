/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createHash } from 'node:crypto'

const base = process.env.VITE_BASE_PATH ?? '/skyrim-quests/'

/** Production CSP as a meta tag (GitHub Pages cannot send headers). Dev is excluded: Vite injects inline scripts. */
function csp(): Plugin {
  return {
    name: 'skyrim-csp',
    apply: 'build',
    transformIndexHtml(html) {
      const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1])
      const hashes = inline.map((src) => `'sha256-${createHash('sha256').update(src).digest('base64')}'`)
      const proxy = process.env.VITE_LORE_PROXY_URL ? new URL(process.env.VITE_LORE_PROXY_URL).origin : ''
      const policy = [
        "default-src 'self'",
        `script-src 'self' https://apis.google.com https://www.gstatic.com ${hashes.join(' ')}`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://*.google.com ${proxy}`.trim(),
        'frame-src https://*.firebaseapp.com https://accounts.google.com https://apis.google.com',
        "media-src 'self'",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
      return html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`)
    },
  }
}

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? base : '/',
  plugins: [
    react(),
    csp(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png', 'sounds/*.mp3'],
      manifest: {
        name: 'Skyrim Quests',
        short_name: 'Skyrim Quests',
        description: 'A Skyrim-styled quest log for real life.',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,mp3,webmanifest}'], navigateFallbackDenylist: [/^\/__/] },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          // Keep every Firebase package together: splitting them makes circular chunks.
          if (id.includes('@firebase') || id.includes('/firebase/') || id.includes('re2js') || id.includes('/idb/')) return 'firebase'
          if (id.includes('framer-motion') || id.includes('motion-')) return 'motion'
          return undefined
        },
      },
    },
  },
  test: {
    // Tests run on the local backend whatever a developer's .env says.
    env: { VITE_FIREBASE_API_KEY: '', VITE_FIREBASE_PROJECT_ID: '' }, environment: 'jsdom', globals: true },
}))
