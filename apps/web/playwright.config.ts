import { defineConfig, devices } from '@playwright/test'
import { signedInState } from './e2e/support/session'

const port = 3000
const baseURL = `http://localhost:${String(port)}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  expect: { timeout: 10_000 },
  globalTeardown: './e2e/support/global-teardown.ts',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], storageState: signedInState },
      dependencies: ['setup'],
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: signedInState,
      },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: `next dev --port ${String(port)}`,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
