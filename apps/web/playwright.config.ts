import { defineConfig, devices } from '@playwright/test'
import { signedInState } from './e2e/support/session'
import { localSupabase } from './e2e/support/supabase'

const port = 3000
const baseURL = `http://localhost:${String(port)}`
const apiUrl = 'http://127.0.0.1:3333'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  expect: { timeout: 20_000 },
  globalTeardown: './e2e/support/global-teardown.ts',
  use: {
    baseURL,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'], locale: 'pt-BR', storageState: signedInState },
      dependencies: ['setup'],
    },
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        locale: 'pt-BR',
        viewport: { width: 1440, height: 900 },
        storageState: signedInState,
      },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: 'node src/server.ts',
      cwd: '../api',
      url: `${apiUrl}/health`,
      reuseExistingServer: true,
      env: {
        PORT: '3333',
        LOG_LEVEL: 'warn',
        CORS_ORIGINS: baseURL,
        DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55322/postgres',
        SUPABASE_URL: 'http://127.0.0.1:55321',
        SUPABASE_SECRET_KEY: localSupabase().SECRET_KEY,
        WEB_URL: baseURL,
        MAILPIT_URL: 'http://127.0.0.1:55324',
      },
    },
    {
      command: `next dev --port ${String(port)}`,
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { API_URL: apiUrl },
    },
  ],
})
