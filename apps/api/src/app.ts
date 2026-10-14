import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { AppConfig } from './config/env.ts'
import { healthRoutes } from './modules/health/health.routes.ts'
import { registerErrorHandler } from './plugins/error-handler.ts'
import { registerSecurity } from './plugins/security.ts'
import type { App } from './shared/http.ts'

export async function buildApp(config: AppConfig): Promise<App> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  registerErrorHandler(app)

  await registerSecurity(app, config)
  await app.register(healthRoutes)

  return app
}
