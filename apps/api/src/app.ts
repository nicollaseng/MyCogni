import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type FastifyPluginAsyncZod,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import type { AssistantModel } from './ai/assistant-model.ts'
import type { Transcriber } from './ai/transcriber.ts'
import type { AccountAdmin } from './auth/account-admin.ts'
import { createAccountTypeReader } from './auth/account-types.ts'
import type { TokenVerifier } from './auth/token-verifier.ts'
import type { AppConfig } from './config/env.ts'
import type { Database } from './db/client.ts'
import { createJobScheduler, type JobScheduler } from './jobs/scheduler.ts'
import { createMailer, type Mailer } from './mail/mailer.ts'
import { accountModule } from './modules/account/index.ts'
import { adminModule } from './modules/admin/index.ts'
import { alertModule } from './modules/alerts/index.ts'
import { assessmentModule } from './modules/assessments/index.ts'
import { assistantModule } from './modules/assistant/index.ts'
import { careLinkModule } from './modules/care-links/index.ts'
import { checkInModule } from './modules/check-ins/index.ts'
import { consentModule } from './modules/consents/index.ts'
import { healthRoutes } from './modules/health/health.routes.ts'
import { insightModule } from './modules/insights/index.ts'
import { invitationModule, invitationPublicModule } from './modules/invitations/index.ts'
import { journalModule } from './modules/journal/index.ts'
import { memoryModule } from './modules/memories/index.ts'
import { notificationModule } from './modules/notifications/index.ts'
import { onboardingModule } from './modules/onboarding/index.ts'
import { professionalModule } from './modules/professionals/index.ts'
import { profileModule } from './modules/profile/index.ts'
import { reminderModule, reminderPublicModule } from './modules/reminders/index.ts'
import type { Fetcher } from './modules/profile/photo-download.ts'
import { reportModule } from './modules/reports/index.ts'
import { supportModule } from './modules/support/index.ts'
import { transcriptionModule } from './modules/transcription/index.ts'
import { zenModule } from './modules/zen/index.ts'
import { requireAccountType } from './plugins/account-type.ts'
import { requireAuthentication } from './plugins/authentication.ts'
import { registerErrorHandler } from './plugins/error-handler.ts'
import { registerSecurity } from './plugins/security.ts'
import type { App } from './shared/http.ts'
import { createRateLimiter, type RateLimiter } from './shared/rate-limiter.ts'
import type { BucketStore } from './storage/bucket-store.ts'
import type { JournalImageStore } from './storage/journal-images.ts'
import type { ProfileFileStores } from './storage/profile-files.ts'

export interface AppDependencies {
  config: AppConfig
  db: Database
  verifier: TokenVerifier
  accountAdmin: AccountAdmin
  journalImages: JournalImageStore
  profileFiles: ProfileFileStores
  photoFetcher: Fetcher
  supportAttachments: BucketStore
  assistantModel: AssistantModel | null
  transcriber: Transcriber | null
  logStream?: { write(line: string): void }
}

function publicRoutes(
  { config, db, profileFiles }: AppDependencies,
  mailer: Mailer,
): FastifyPluginAsyncZod {
  return async (api) => {
    await api.register(
      invitationPublicModule({ db, photos: profileFiles.photos, mailer, webUrl: config.webUrl }),
    )
    await api.register(reminderPublicModule(reminderOptions(config, db)))
  }
}

function reminderOptions(config: AppConfig, db: Database) {
  return { db, tokenSecret: config.supabaseSecretKey, pushKey: config.push?.publicKey ?? null }
}

interface Services {
  mailer: Mailer
  jobs: JobScheduler
  limiter: RateLimiter
}

function authenticatedRoutes(
  {
    config,
    db,
    verifier,
    accountAdmin,
    journalImages,
    profileFiles,
    photoFetcher,
    supportAttachments,
    assistantModel,
    transcriber,
  }: AppDependencies,
  { mailer, jobs, limiter }: Services,
): FastifyPluginAsyncZod {
  return async (api) => {
    requireAuthentication(api, verifier)
    const accountTypes = createAccountTypeReader(db)
    requireAccountType(api, accountTypes)
    await api.register(
      profileModule({
        db,
        accounts: accountAdmin,
        photos: profileFiles.photos,
        fetcher: photoFetcher,
        log: api.log,
      }),
    )
    await api.register(consentModule(db, accountTypes))
    await api.register(assessmentModule(db, jobs))
    await api.register(checkInModule(db, jobs, api.log))
    await api.register(onboardingModule(db))
    await api.register(professionalModule(db))
    await api.register(
      accountModule(db, accountAdmin, [
        journalImages,
        profileFiles.photos,
        profileFiles.documents,
        supportAttachments,
      ]),
    )
    await api.register(
      invitationModule({ db, photos: profileFiles.photos, mailer, webUrl: config.webUrl }),
    )
    await api.register(careLinkModule(db, profileFiles.photos))
    await api.register(notificationModule(db))
    await api.register(adminModule(db, profileFiles.documents))
    await api.register(journalModule({ db, images: journalImages, jobs, log: api.log }))
    await api.register(insightModule(db))
    await api.register(reportModule(db))
    await api.register(alertModule(db, profileFiles.photos))
    await api.register(zenModule(db))
    await api.register(
      assistantModule({
        db,
        model: assistantModel,
        voice: transcriber !== null,
        limiter,
        log: api.log,
        jobs,
      }),
    )
    await api.register(memoryModule(db))
    await api.register(transcriptionModule({ transcriber, limiter, log: api.log }))
    await api.register(reminderModule(reminderOptions(config, db)))
    await api.register(
      supportModule({
        db,
        attachments: supportAttachments,
        mailer,
        limiter,
        webUrl: config.webUrl,
        supportEmail: config.supportEmail,
      }),
    )
  }
}

export async function buildApp(dependencies: AppDependencies): Promise<App> {
  const app = Fastify({
    logger: {
      level: dependencies.config.logLevel,
      redact: ['req.headers.authorization', 'req.headers.cookie'],
      ...(dependencies.logStream === undefined ? {} : { stream: dependencies.logStream }),
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
  const limiter = createRateLimiter(dependencies.config.redisUrl, app.log)
  app.addHook('onClose', () => Promise.all([jobs.close(), limiter.close()]).then(() => undefined))
  await app.register(authenticatedRoutes(dependencies, { mailer, jobs, limiter }), {
    prefix: '/v1',
  })

  return app
}
