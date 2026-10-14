import { defineConfig, devices } from '@playwright/test'

const port = 3000
const baseURL = `http://localhost:${String(port)}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: `next dev --port ${String(port)}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
