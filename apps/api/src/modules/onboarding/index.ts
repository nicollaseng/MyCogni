import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createAssessmentRepository } from '../assessments/assessment.repository.ts'
import { createConsentRepository } from '../consents/consent.repository.ts'
import { createProfileRepository } from '../profile/profile.repository.ts'
import { onboardingRoutes } from './onboarding.routes.ts'
import { createOnboardingService } from './onboarding.service.ts'

export function onboardingModule(db: Database): FastifyPluginCallbackZod {
  return onboardingRoutes(
    createOnboardingService({
      profiles: createProfileRepository(db),
      consents: createConsentRepository(db),
      assessments: createAssessmentRepository(db),
    }),
  )
}
