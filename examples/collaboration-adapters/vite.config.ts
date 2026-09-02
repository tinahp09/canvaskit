import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
export default defineConfig({ resolve: { alias: {
  '@canvaskit/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
  '@canvaskit/geometry': fileURLToPath(new URL('../../packages/geometry/src/index.ts', import.meta.url)),
  '@canvaskit/collaboration-adapters': fileURLToPath(new URL('../../packages/collaboration-adapters/src/index.ts', import.meta.url)),
} } })
