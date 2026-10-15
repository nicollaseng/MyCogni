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
import { assessmentModule } from './modules/assessments/index.ts'
import { checkInModule } from './modules/check-ins/index.ts'
import { consentModule } from './modules/consents/index.ts'
import { healthRoutes } from './modules/health/health.routes.ts'
import { onboardingModule } from './modules/onboarding/index.ts'
import { professionalModule } from './modules/professionals/index.ts'
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
    await api.register(consentModule(db))
    await api.register(assessmentModule(db))
    await api.register(checkInModule(db))
    await api.register(onboardingModule(db))
    await api.register(professionalModule(db))
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
