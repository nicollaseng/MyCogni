import {
  patientInsightContentSchema,
  professionalInsightContentSchema,
  type PatientInsight,
  type ProfessionalInsight,
} from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { CareLinkRepository } from '../care-links/care-link.repository.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import type { InsightRecord, InsightRepository } from './insight.repository.ts'

export interface InsightService {
  mine(user: AuthenticatedUser): Promise<PatientInsight[]>
  ofPatient(user: AuthenticatedUser, patientId: string): Promise<ProfessionalInsight[]>
}

export interface InsightServiceDependencies {
  insights: InsightRepository
  careLinks: CareLinkRepository
  professionals: ProfessionalRepository
}

const listLimit = 10

function base(record: InsightRecord) {
  return {
    id: record.id,
    periodStart: record.periodStart.toISOString(),
    periodEnd: record.periodEnd.toISOString(),
    checkInCount: record.checkInCount,
    createdAt: record.createdAt.toISOString(),
  }
}

export function createInsightService({
  insights,
  careLinks,
  professionals,
}: InsightServiceDependencies): InsightService {
  return {
    async mine(user) {
      const records = await insights.listForPatient(user.id, listLimit)
      return records.flatMap((record) => {
        const content = patientInsightContentSchema.safeParse(record.content)
        return content.success ? [{ ...base(record), content: content.data }] : []
      })
    },
    async ofPatient(user, patientId) {
      const professional = await professionals.find(user.id)
      if (professional?.status !== 'verified') {
        throw new ForbiddenError('Only verified professionals can read summaries')
      }
      const linked = (await careLinks.listPatients(user.id)).some(
        (link) => link.patientId === patientId,
      )
      if (!linked) {
        throw new NotFoundError('Patient not found')
      }
      const records = await insights.listForProfessional(user.id, patientId, listLimit)
      return records.flatMap((record) => {
        const content = professionalInsightContentSchema.safeParse(record.content)
        return content.success ? [{ ...base(record), content: content.data }] : []
      })
    },
  }
}
