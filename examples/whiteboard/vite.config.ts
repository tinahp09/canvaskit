import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@canvaskit/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
      '@canvaskit/geometry': fileURLToPath(new URL('../../packages/geometry/src/index.ts', import.meta.url)),
      '@canvaskit/renderer-canvas': fileURLToPath(new URL('../../packages/renderer-canvas/src/index.ts', import.meta.url)),
    },
  },
})
