import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import type { AppConfig } from '../config/env.ts'
import type { App } from '../shared/http.ts'

export async function registerSecurity(app: App, config: AppConfig): Promise<void> {
  await app.register(helmet)
  await app.register(cors, { origin: config.corsOrigins })
}
