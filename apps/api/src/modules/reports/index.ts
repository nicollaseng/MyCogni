import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import type { Database } from '../../db/client.ts'
import { createAssessmentRepository } from '../assessments/assessment.repository.ts'
import { createCareLinkRepository } from '../care-links/care-link.repository.ts'
import { createCheckInRepository } from '../check-ins/check-in.repository.ts'
import { createInsightRepository } from '../insights/insight.repository.ts'
import { createProfessionalRepository } from '../professionals/professional.repository.ts'
import { createProfileRepository } from '../profile/profile.repository.ts'
import { renderReportPdf } from './report-pdf.ts'
import { reportRoutes } from './report.routes.ts'
import { createReportService } from './report.service.ts'

export function reportModule(db: Database): FastifyPluginCallbackZod {
  return reportRoutes(
    createReportService({
      profiles: createProfileRepository(db),
      checkIns: createCheckInRepository(db),
      assessments: createAssessmentRepository(db),
      insights: createInsightRepository(db),
      careLinks: createCareLinkRepository(db),
      professionals: createProfessionalRepository(db),
      render: renderReportPdf,
      now: () => new Date(),
    }),
  )
}
