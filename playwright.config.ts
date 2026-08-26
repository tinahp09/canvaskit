import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './examples',
  testMatch: '**/e2e/**/*.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'chrome',
  },
  webServer: [
    {
      command: './node_modules/.bin/vite examples/basic-canvas --host 127.0.0.1 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/react-canvas --host 127.0.0.1 --port 4174',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/vue-canvas --host 127.0.0.1 --port 4175',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: true,
    },
  ],
})
