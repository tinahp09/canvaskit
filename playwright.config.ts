import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './examples/basic-canvas/e2e',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
  },
  webServer: {
    command: 'pnpm --filter @canvaskit/basic-canvas exec vite --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
})
