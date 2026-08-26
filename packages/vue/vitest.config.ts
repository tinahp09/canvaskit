import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@canvaskit/core': new URL('../core/src/index.ts', import.meta.url).pathname,
      '@canvaskit/renderer-canvas': new URL('../renderer-canvas/src/index.ts', import.meta.url).pathname,
    },
  },
})
