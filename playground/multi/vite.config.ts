import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },

  server: {
    port: 5174,
    open: true,
  },

  build: {
    target: 'es2020',
    sourcemap: true,
  },

  optimizeDeps: {
    include: [
      '@wry-smile/xgplayer-ws-fmp4',
      'xgplayer',
    ],
  },
})
