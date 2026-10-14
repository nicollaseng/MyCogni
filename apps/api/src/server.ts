import { buildApp } from './app.ts'
import { loadConfig } from './config/env.ts'

const config = loadConfig(process.env)
const app = await buildApp(config)

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
