import type { Assessment, SubmitAssessmentInput } from '@mycogni/contracts'
import { instruments, maxScoreOf, scoreAssessment } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { AssessmentRecord, AssessmentRepository } from './assessment.repository.ts'

export interface AssessmentService {
  submit(user: AuthenticatedUser, input: SubmitAssessmentInput): Promise<Assessment>
  list(user: AuthenticatedUser): Promise<Assessment[]>
}

export function toAssessment(record: AssessmentRecord): Assessment {
  return {
    id: record.id,
    instrument: record.instrument,
    totalScore: record.totalScore,
    maxScore: maxScoreOf(instruments[record.instrument]),
    severity: record.severity,
    hasRiskFlag: record.hasRiskFlag,
    completedAt: record.completedAt.toISOString(),
  }
}

export function createAssessmentService(repository: AssessmentRepository): AssessmentService {
  return {
    async submit(user, { instrument, answers }) {
      const score = scoreAssessment(instruments[instrument], answers)
      const record = await repository.create(user.id, { instrument, answers, ...score })
      return toAssessment(record)
    },
    async list(user) {
      const records = await repository.list(user.id, user.id)
      return records.map(toAssessment)
    },
  }
}
