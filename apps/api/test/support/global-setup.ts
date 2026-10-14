import { runMigrations } from '../../src/db/migrate.ts'
import { testDatabaseUrl } from './database.ts'

export default async function globalSetup(): Promise<void> {
  await runMigrations(testDatabaseUrl)
}
