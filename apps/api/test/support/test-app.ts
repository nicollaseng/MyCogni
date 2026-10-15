import { buildApp } from '../../src/app.ts'
import { createSupabaseAccountAdmin } from '../../src/auth/account-admin.ts'
import { createSupabaseTokenVerifier, type TokenVerifier } from '../../src/auth/token-verifier.ts'
import { loadConfig } from '../../src/config/env.ts'
import type { Database } from '../../src/db/client.ts'
import { UnauthorizedError } from '../../src/shared/errors.ts'
import type { App } from '../../src/shared/http.ts'
import { createJournalImageStore } from '../../src/storage/journal-images.ts'
import { testDatabaseUrl } from './database.ts'
import { testMailpitUrl, testSupabaseUrl } from './supabase.ts'

export const allowedOrigin = 'http://localhost:3000'

export const testConfig = loadConfig({
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  CORS_ORIGINS: allowedOrigin,
  DATABASE_URL: testDatabaseUrl,
  SUPABASE_URL: testSupabaseUrl,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  WEB_URL: allowedOrigin,
  MAILPIT_URL: testMailpitUrl,
})

export const rejectingVerifier: TokenVerifier = {
  verify: () => Promise.reject(new UnauthorizedError()),
}

export function supabaseVerifier(): TokenVerifier {
  return createSupabaseTokenVerifier(testConfig.supabaseUrl)
}

interface TestAppOptions {
  db: Database
  verifier?: TokenVerifier
}

export function buildTestApp({ db, verifier = rejectingVerifier }: TestAppOptions): Promise<App> {
  return buildApp({
    config: testConfig,
    db,
    verifier,
    accountAdmin: createSupabaseAccountAdmin(testConfig.supabaseUrl, testConfig.supabaseSecretKey),
    journalImages: createJournalImageStore(testConfig.supabaseUrl, testConfig.supabaseSecretKey),
  })
}
