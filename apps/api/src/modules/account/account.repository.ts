import { asc, desc, eq } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { assessments, checkIns, consents, profiles, zenSessions } from '../../db/schema/index.ts'
import type { AssessmentRecord } from '../assessments/assessment.repository.ts'
import type { CheckInRecord } from '../check-ins/check-in.repository.ts'
import type { ConsentRecord } from '../consents/consent.repository.ts'
import { memoriesOf, type MemoryRecord } from '../memories/memory.repository.ts'
import { reminderExportOf, type ReminderExport } from '../reminders/reminder.repository.ts'
import { profileColumns, type ProfileRecord } from '../profile/profile.repository.ts'
import { sessionColumns, type SessionRecord } from '../zen/zen-sessions.repository.ts'

export interface AccountData {
  profile: ProfileRecord | undefined
  consents: (ConsentRecord & { revokedAt: Date | null })[]
  assessments: (AssessmentRecord & { answers: number[] })[]
  checkIns: CheckInRecord[]
  memories: MemoryRecord[]
  reminders: ReminderExport
  zenSessions: SessionRecord[]
}

export interface AccountRepository {
  collect(userId: string): Promise<AccountData>
}

export function createAccountRepository(db: Database): AccountRepository {
  return {
    collect(userId) {
      return withUser(db, userId, async (tx) => {
        const [profile] = await tx
          .select(profileColumns)
          .from(profiles)
          .where(eq(profiles.id, userId))
        return {
          profile,
          consents: await tx
            .select({
              kind: consents.kind,
              version: consents.version,
              grantedAt: consents.grantedAt,
              revokedAt: consents.revokedAt,
            })
            .from(consents)
            .where(eq(consents.userId, userId))
            .orderBy(asc(consents.grantedAt)),
          assessments: await tx
            .select({
              id: assessments.id,
              instrument: assessments.instrument,
              answers: assessments.answers,
              totalScore: assessments.totalScore,
              severity: assessments.severity,
              hasRiskFlag: assessments.hasRiskFlag,
              completedAt: assessments.completedAt,
            })
            .from(assessments)
            .where(eq(assessments.userId, userId))
            .orderBy(desc(assessments.completedAt)),
          checkIns: await tx
            .select({
              id: checkIns.id,
              moodLevel: checkIns.moodLevel,
              emotions: checkIns.emotions,
              contexts: checkIns.contexts,
              note: checkIns.note,
              recordedAt: checkIns.recordedAt,
            })
            .from(checkIns)
            .where(eq(checkIns.userId, userId))
            .orderBy(desc(checkIns.recordedAt)),
          memories: await memoriesOf(tx, userId),
          reminders: await reminderExportOf(tx, userId),
          zenSessions: await tx
            .select(sessionColumns)
            .from(zenSessions)
            .where(eq(zenSessions.userId, userId))
            .orderBy(desc(zenSessions.startedAt)),
        }
      })
    },
  }
}
