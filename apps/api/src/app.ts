import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type FastifyPluginAsyncZod,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { AccountAdmin } from './auth/account-admin.ts'
import type { TokenVerifier } from './auth/token-verifier.ts'
import type { AppConfig } from './config/env.ts'
import type { Database } from './db/client.ts'
import { createJobScheduler, type JobScheduler } from './jobs/scheduler.ts'
import { createMailer, type Mailer } from './mail/mailer.ts'
import { accountModule } from './modules/account/index.ts'
import { adminModule } from './modules/admin/index.ts'
import { alertModule } from './modules/alerts/index.ts'
import { assessmentModule } from './modules/assessments/index.ts'
import { careLinkModule } from './modules/care-links/index.ts'
import { checkInModule } from './modules/check-ins/index.ts'
import { consentModule } from './modules/consents/index.ts'
import { healthRoutes } from './modules/health/health.routes.ts'
import { insightModule } from './modules/insights/index.ts'
import { invitationModule, invitationPublicModule } from './modules/invitations/index.ts'
import { journalModule } from './modules/journal/index.ts'
import { notificationModule } from './modules/notifications/index.ts'
import { onboardingModule } from './modules/onboarding/index.ts'
import { professionalModule } from './modules/professionals/index.ts'
import { profileModule } from './modules/profile/index.ts'
import { reportModule } from './modules/reports/index.ts'
import { requireAuthentication } from './plugins/authentication.ts'
import { registerErrorHandler } from './plugins/error-handler.ts'
import { registerSecurity } from './plugins/security.ts'
import type { App } from './shared/http.ts'
import type { JournalImageStore } from './storage/journal-images.ts'
import type { ProfileFileStores } from './storage/profile-files.ts'

export interface AppDependencies {
  config: AppConfig
  db: Database
  verifier: TokenVerifier
  accountAdmin: AccountAdmin
  journalImages: JournalImageStore
  profileFiles: ProfileFileStores
}

function publicRoutes(
  { config, db, profileFiles }: AppDependencies,
  mailer: Mailer,
): FastifyPluginAsyncZod {
  return async (api) => {
    await api.register(
      invitationPublicModule({ db, photos: profileFiles.photos, mailer, webUrl: config.webUrl }),
    )
  }
}

function authenticatedRoutes(
  { config, db, verifier, accountAdmin, journalImages, profileFiles }: AppDependencies,
  mailer: Mailer,
  jobs: JobScheduler,
): FastifyPluginAsyncZod {
  return async (api) => {
    requireAuthentication(api, verifier)
    await api.register(profileModule(db))
    await api.register(consentModule(db))
    await api.register(assessmentModule(db, jobs))
    await api.register(checkInModule(db, jobs))
    await api.register(onboardingModule(db))
    await api.register(professionalModule(db))
    await api.register(accountModule(db, accountAdmin))
    await api.register(
      invitationModule({ db, photos: profileFiles.photos, mailer, webUrl: config.webUrl }),
    )
    await api.register(careLinkModule(db, profileFiles.photos))
    await api.register(notificationModule(db))
    await api.register(adminModule(db, profileFiles.documents))
    await api.register(journalModule({ db, images: journalImages, log: api.log }))
    await api.register(insightModule(db))
    await api.register(reportModule(db))
    await api.register(alertModule(db))
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
  const mailer = createMailer(dependencies.config.mail, app.log)
  await app.register(publicRoutes(dependencies, mailer), { prefix: '/v1/public' })
  const jobs = createJobScheduler(
    { redisUrl: dependencies.config.redisUrl, prefix: dependencies.config.queuePrefix },
    app.log,
  )
  app.addHook('onClose', () => jobs.close())
  await app.register(authenticatedRoutes(dependencies, mailer, jobs), { prefix: '/v1' })

  return app
}
