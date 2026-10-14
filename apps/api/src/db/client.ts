import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.ts'

export type Database = PostgresJsDatabase<typeof schema>

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

export interface DatabaseConnection {
  db: Database
  close: () => Promise<void>
}

export function connectDatabase(url: string): DatabaseConnection {
  const client = postgres(url, { prepare: false, onnotice: () => undefined })
  return {
    db: drizzle({ client, schema }),
    close: () => client.end(),
  }
}
