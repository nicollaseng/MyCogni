import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { AssistantModel } from '../../ai/assistant-model.ts'
import type { Database } from '../../db/client.ts'
import type { JobScheduler } from '../../jobs/scheduler.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import { createAssessmentRepository } from '../assessments/assessment.repository.ts'
import { createCareLinkRepository } from '../care-links/care-link.repository.ts'
import { createCheckInRepository } from '../check-ins/check-in.repository.ts'
import { createConsentRepository } from '../consents/consent.repository.ts'
import { createInsightRepository } from '../insights/insight.repository.ts'
import { createJournalRepository } from '../journal/journal.repository.ts'
import { rememberConversations } from '../memories/memory-triggers.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createAssistantToolbox } from './assistant-tools.ts'
import { createAssistantRepository } from './assistant.repository.ts'
import { assistantRoutes } from './assistant.routes.ts'
import { createAssistantService, type AssistantLog } from './assistant.service.ts'

export interface AssistantModuleOptions {
  db: Database
  model: AssistantModel | null
  voice: boolean
  limiter: RateLimiter
  log: AssistantLog
  jobs: JobScheduler
}

export function assistantModule({
  db,
  model,
  voice,
  limiter,
  log,
  jobs,
}: AssistantModuleOptions): FastifyPluginCallbackZod {
  const now = () => new Date()
  const assessments = createAssessmentRepository(db)
  const journal = createJournalRepository(db)
  return assistantRoutes(
    rememberConversations(
      createAssistantService({
        conversations: createAssistantRepository(db),
        toolbox: createAssistantToolbox({
          checkIns: createCheckInRepository(db),
          assessments,
          insights: createInsightRepository(db),
          journal,
          now,
        }),
        consents: createConsentRepository(db),
        careLinks: createCareLinkRepository(db),
        professionals: createProfessionalRepository(db),
        assessments,
        journal,
        model,
        voice,
        limiter,
        log,
        now,
      }),
      jobs,
    ),
  )
}
