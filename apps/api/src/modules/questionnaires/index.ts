import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import type { Mailer } from '../../mail/mailer.ts'
import type { ErrorLog } from '../../shared/log.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createPatientQuestionnaireRepository } from './patient-questionnaire.repository.ts'
import { createPatientQuestionnaireService } from './patient-questionnaire.service.ts'
import { createProfessionalQuestionnaireRepository } from './professional-questionnaire.repository.ts'
import { createProfessionalQuestionnaireService } from './professional-questionnaire.service.ts'
import { createQuestionnaireNotifier } from './questionnaire-notifier.ts'
import { questionnaireRoutes } from './questionnaire.routes.ts'

export interface QuestionnaireModuleOptions {
  db: Database
  mailer: Mailer
  jobs: JobScheduler
  limiter: RateLimiter
  webUrl: string
  log: ErrorLog
}

export function questionnaireModule({
  db,
  mailer,
  jobs,
  limiter,
  webUrl,
  log,
}: QuestionnaireModuleOptions): FastifyPluginCallbackZod {
  const notifier = createQuestionnaireNotifier({ db, mailer, webUrl })
  return questionnaireRoutes(
    createProfessionalQuestionnaireService({
      questionnaires: createProfessionalQuestionnaireRepository(db),
      professionals: createProfessionalRepository(db),
      notifier,
      limiter,
      log,
    }),
    createPatientQuestionnaireService({
      questionnaires: createPatientQuestionnaireRepository(db),
      notifier,
      jobs,
      log,
      now: () => new Date(),
    }),
  )
}
