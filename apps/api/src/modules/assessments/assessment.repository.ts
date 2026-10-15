import type { InstrumentId, Severity } from '@mycogni/domain'
import { desc, eq } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { assessments } from '../../db/schema/index.ts'

export interface AssessmentRecord {
  id: string
  instrument: InstrumentId
  totalScore: number
  severity: Severity
  hasRiskFlag: boolean
  completedAt: Date
}

export interface NewAssessment {
  instrument: InstrumentId
  answers: number[]
  totalScore: number
  severity: Severity
  hasRiskFlag: boolean
}

export interface AssessmentRepository {
  create(userId: string, assessment: NewAssessment): Promise<AssessmentRecord>
  list(viewerId: string, ownerId: string): Promise<AssessmentRecord[]>
  completedInstruments(userId: string): Promise<InstrumentId[]>
}

const columns = {
  id: assessments.id,
  instrument: assessments.instrument,
  totalScore: assessments.totalScore,
  severity: assessments.severity,
  hasRiskFlag: assessments.hasRiskFlag,
  completedAt: assessments.completedAt,
}

export function createAssessmentRepository(db: Database): AssessmentRepository {
  return {
    create(userId, assessment) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(assessments)
          .values({ ...assessment, userId })
          .returning(columns)
        if (row === undefined) {
          throw new Error('Assessment was not saved')
        }
        return row
      })
    },
    list(viewerId, ownerId) {
      return withUser(db, viewerId, (tx) =>
        tx
          .select(columns)
          .from(assessments)
          .where(eq(assessments.userId, ownerId))
          .orderBy(desc(assessments.completedAt)),
      )
    },
    completedInstruments(userId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .selectDistinct({ instrument: assessments.instrument })
          .from(assessments)
          .where(eq(assessments.userId, userId))
        return rows.map((row) => row.instrument)
      })
    },
  }
}
