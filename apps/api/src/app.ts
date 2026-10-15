import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type FastifyPluginAsyncZod,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { TokenVerifier } from './auth/token-verifier.ts'
import type { AppConfig } from './config/env.ts'
import type { Database } from './db/client.ts'
import { healthRoutes } from './modules/health/health.routes.ts'
import { profileModule } from './modules/profile/index.ts'
import { requireAuthentication } from './plugins/authentication.ts'
import { registerErrorHandler } from './plugins/error-handler.ts'
import { registerSecurity } from './plugins/security.ts'
import type { App } from './shared/http.ts'

export interface AppDependencies {
  config: AppConfig
  db: Database
  verifier: TokenVerifier
}

function authenticatedRoutes({ db, verifier }: AppDependencies): FastifyPluginAsyncZod {
  return async (api) => {
    requireAuthentication(api, verifier)
    await api.register(profileModule(db))
  }
}

export async function buildApp(dependencies: AppDependencies): Promise<App> {
  const app = Fastify({
    logger: {
      level: dependencies.config.logLevel,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  registerErrorHandler(app)

  await registerSecurity(app, dependencies.config)
  await app.register(healthRoutes)
  await app.register(authenticatedRoutes(dependencies), { prefix: '/v1' })

  return app
}
