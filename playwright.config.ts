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
    {
      command: './node_modules/.bin/vite examples/performance-canvas --host 127.0.0.1 --port 4176',
      url: 'http://127.0.0.1:4176',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/whiteboard --host 127.0.0.1 --port 4177',
      url: 'http://127.0.0.1:4177',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/erd --host 127.0.0.1 --port 4178',
      url: 'http://127.0.0.1:4178',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/architecture --host 127.0.0.1 --port 4179',
      url: 'http://127.0.0.1:4179',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/diagram-editor --host 127.0.0.1 --port 4180',
      url: 'http://127.0.0.1:4180',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/collaboration --host 127.0.0.1 --port 4181',
      url: 'http://127.0.0.1:4181',
      reuseExistingServer: true,
    },
    {
      command: './node_modules/.bin/vite examples/collaboration-adapters --host 127.0.0.1 --port 4185',
      url: 'http://127.0.0.1:4185',
      reuseExistingServer: true,
    },
  ],
})
