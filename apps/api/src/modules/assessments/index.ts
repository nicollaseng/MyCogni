import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createAssessmentRepository } from './assessment.repository.ts'
import { assessmentRoutes } from './assessment.routes.ts'
import { createAssessmentService } from './assessment.service.ts'

export function assessmentModule(db: Database): FastifyPluginCallbackZod {
  return assessmentRoutes(createAssessmentService(createAssessmentRepository(db)))
}
