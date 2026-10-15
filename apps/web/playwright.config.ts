import { defineConfig, devices } from '@playwright/test'
import { signedInState } from './e2e/support/session'
import { localSupabase } from './e2e/support/supabase'

const port = Number(process.env.E2E_WEB_PORT ?? '3000')
const apiPort = process.env.E2E_API_PORT ?? '3333'
const baseURL = `http://localhost:${String(port)}`
const apiUrl = `http://127.0.0.1:${apiPort}`
const services = {
  LOG_LEVEL: 'warn',
  DATABASE_URL: 'postgresql://postgres:postgres@127.0.0.1:55322/postgres',
  SUPABASE_URL: 'http://127.0.0.1:55321',
  SUPABASE_SECRET_KEY: localSupabase().SECRET_KEY,
  WEB_URL: baseURL,
  MAILPIT_URL: 'http://127.0.0.1:55324',
  REDIS_URL: 'redis://127.0.0.1:56379',
  QUEUE_PREFIX: `e2e-${apiPort}`,
}

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
      env: { ...services, PORT: apiPort, CORS_ORIGINS: baseURL },
    },
    {
      command: 'node src/worker.ts',
      cwd: '../api',
      wait: { stdout: /Worker started/ },
      env: services,
    },
    {
      command: `next dev --port ${String(port)}`,
      url: baseURL,
      reuseExistingServer: true,
      timeout: 120_000,
      env: { API_URL: apiUrl, SITE_URL: baseURL },
    },
  ],
})
