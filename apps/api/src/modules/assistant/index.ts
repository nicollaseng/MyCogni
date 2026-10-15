import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { AssistantModel } from '../../ai/assistant-model.ts'
import type { Database } from '../../db/client.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import { createAssessmentRepository } from '../assessments/assessment.repository.ts'
import { createCareLinkRepository } from '../care-links/care-link.repository.ts'
import { createCheckInRepository } from '../check-ins/check-in.repository.ts'
import { createConsentRepository } from '../consents/consent.repository.ts'
import { createInsightRepository } from '../insights/insight.repository.ts'
import { createJournalRepository } from '../journal/journal.repository.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createAssistantToolbox } from './assistant-tools.ts'
import { createAssistantRepository } from './assistant.repository.ts'
import { assistantRoutes } from './assistant.routes.ts'
import { createAssistantService, type AssistantLog } from './assistant.service.ts'

export interface AssistantModuleOptions {
  db: Database
  model: AssistantModel | null
  limiter: RateLimiter
  log: AssistantLog
}

export function assistantModule({
  db,
  model,
  limiter,
  log,
}: AssistantModuleOptions): FastifyPluginCallbackZod {
  const now = () => new Date()
  const assessments = createAssessmentRepository(db)
  return assistantRoutes(
    createAssistantService({
      conversations: createAssistantRepository(db),
      toolbox: createAssistantToolbox({
        checkIns: createCheckInRepository(db),
        assessments,
        insights: createInsightRepository(db),
        journal: createJournalRepository(db),
        now,
      }),
      consents: createConsentRepository(db),
      careLinks: createCareLinkRepository(db),
      professionals: createProfessionalRepository(db),
      assessments,
      model,
      limiter,
      log,
      now,
    }),
  )
}
