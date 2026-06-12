import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/index.ts',
  format: ['esm', 'commonjs', 'iife', 'umd'],
  globalName: 'XgplayerWsFmp4',
  platform: 'browser',
  minify: true,
  shims: true,
  deps: {
    alwaysBundle: ['mp4box'],
  },
  external: ['xgplayer'],
  outputOptions: {
    globals: {
      xgplayer: 'Player',
    },
  },
})
