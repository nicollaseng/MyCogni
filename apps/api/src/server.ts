import { buildApp } from './app.ts'
import { createSupabaseAccountAdmin } from './auth/account-admin.ts'
import { createSupabaseTokenVerifier } from './auth/token-verifier.ts'
import { loadConfig } from './config/env.ts'
import { connectDatabase } from './db/client.ts'

const config = loadConfig(process.env)
const database = connectDatabase(config.databaseUrl)
const app = await buildApp({
  config,
  db: database.db,
  verifier: createSupabaseTokenVerifier(config.supabaseUrl),
  accountAdmin: createSupabaseAccountAdmin(config.supabaseUrl, config.supabaseSecretKey),
})

app.addHook('onClose', () => database.close())

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info({ signal }, 'Shutting down')
  await app.close()
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void shutdown(signal)
  })
}

await app.listen({ host: config.host, port: config.port })
