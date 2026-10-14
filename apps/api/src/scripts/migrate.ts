import { loadDatabaseUrl } from '../config/database.ts'
import { runMigrations } from '../db/migrate.ts'

await runMigrations(loadDatabaseUrl(process.env))
console.info('Migrations applied')
