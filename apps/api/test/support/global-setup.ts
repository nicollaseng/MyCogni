import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { runMigrations } from '../../src/db/migrate.ts'
import { testDatabaseUrl } from './database.ts'

const statusSchema = z.object({
  API_URL: z.url(),
  ANON_KEY: z.string(),
  SERVICE_ROLE_KEY: z.string(),
})

const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url))

function exposeLocalSupabase(): void {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY !== undefined) {
    return
  }
  const output = execFileSync('supabase', ['status', '-o', 'json'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const status = statusSchema.parse(JSON.parse(output))
  process.env.SUPABASE_URL = status.API_URL
  process.env.SUPABASE_ANON_KEY = status.ANON_KEY
  process.env.SUPABASE_SERVICE_ROLE_KEY = status.SERVICE_ROLE_KEY
}

export default async function globalSetup(): Promise<void> {
  await runMigrations(testDatabaseUrl)
  exposeLocalSupabase()
}
