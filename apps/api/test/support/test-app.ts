import { buildApp } from '../../src/app.ts'
import { loadConfig } from '../../src/config/env.ts'
import type { App } from '../../src/shared/http.ts'

export const allowedOrigin = 'http://localhost:3000'

export function buildTestApp(): Promise<App> {
  return buildApp(
    loadConfig({
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      CORS_ORIGINS: allowedOrigin,
    }),
  )
}
