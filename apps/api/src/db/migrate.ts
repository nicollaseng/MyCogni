import { fileURLToPath } from 'node:url'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { connectDatabase } from './client.ts'

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url))

export async function runMigrations(databaseUrl: string): Promise<void> {
  const { db, close } = connectDatabase(databaseUrl)
  try {
    await migrate(db, { migrationsFolder })
  } finally {
    await close()
  }
}
