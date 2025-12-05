import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    './src/index.ts',
  ],
  outDir: 'dist',
  declaration: true,
  sourcemap: true,
  rollup: {
    inlineDependencies: true,
    emitCJS: true,
    esbuild: {
      target: 'es2020',
      minify: true,
    },
  },

  hooks: {
    'build:done': async () => {
      console.log('✅ Build completed successfully')
    },
  },
})
