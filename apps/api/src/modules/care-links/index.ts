import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { createAssessmentRepository } from '../assessments/assessment.repository.ts'
import { createCheckInAddendumRepository } from '../check-ins/check-in-addendum.repository.ts'
import { createCheckInRepository } from '../check-ins/check-in.repository.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createCareLinkRepository } from './care-link.repository.ts'
import { careLinkRoutes } from './care-link.routes.ts'
import { createCareLinkService } from './care-link.service.ts'
import { createPatientMetricsRepository } from './patient-metrics.repository.ts'
import { createPatientService } from './patient.service.ts'

export function careLinkModule(db: Database, photos: BucketStore): FastifyPluginCallbackZod {
  const careLinks = createCareLinkRepository(db)
  return careLinkRoutes(
    createCareLinkService(careLinks, photos),
    createPatientService({
      careLinks,
      metrics: createPatientMetricsRepository(db),
      checkIns: createCheckInRepository(db),
      addenda: createCheckInAddendumRepository(db),
      assessments: createAssessmentRepository(db),
      professionals: createProfessionalRepository(db),
      photos,
      now: () => new Date(),
    }),
  )
}
