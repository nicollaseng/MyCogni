import type { InstrumentId, Severity } from '@mycogni/domain'
import { and, count, countDistinct, desc, eq, gte, inArray, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { assessments, checkIns, invitations, profiles } from '../../db/schema/index.ts'

export interface LastCheckInRecord {
  patientId: string
  moodLevel: number
  recordedAt: Date
}

export interface CheckInStatsRecord {
  lastWeek: number
  lastMonth: number
  moodAverage: number | null
  previousMoodAverage: number | null
}

export interface ScreeningRecord {
  patientId: string
  instrument: InstrumentId
  totalScore: number
  severity: Severity
  hasRiskFlag: boolean
  completedAt: Date
}

export interface ActivityRecord {
  day: string
  checkIns: number
  patients: number
  moodAverage: number | null
}

export interface RecentCheckInRecord {
  patientId: string
  name: string | null
  moodLevel: number
  emotions: string[]
  contexts: string[]
  recordedAt: Date
}

export interface InvitationCountsRecord {
  pending: number
  expiringSoon: number
}

export interface PatientMetricsRepository {
  timeZoneOf(userId: string): Promise<string>
  lastCheckIns(professionalId: string, patientIds: string[]): Promise<LastCheckInRecord[]>
  checkInStats(
    professionalId: string,
    patientIds: string[],
    now: Date,
  ): Promise<Map<string, CheckInStatsRecord>>
  latestScreenings(professionalId: string, patientIds: string[]): Promise<ScreeningRecord[]>
  activity(
    professionalId: string,
    patientIds: string[],
    since: Date,
    timeZone: string,
  ): Promise<ActivityRecord[]>
  recentCheckIns(
    professionalId: string,
    patientIds: string[],
    limit: number,
  ): Promise<RecentCheckInRecord[]>
  invitationCounts(professionalId: string): Promise<InvitationCountsRecord>
}

const dayInMilliseconds = 24 * 60 * 60 * 1000

function daysBefore(now: Date, days: number): string {
  return new Date(now.getTime() - days * dayInMilliseconds).toISOString()
}

function rounded(value: number | null): number | null {
  return value === null ? null : Math.round(value * 10) / 10
}

export function createPatientMetricsRepository(db: Database): PatientMetricsRepository {
  return {
    timeZoneOf(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({ timezone: profiles.timezone })
          .from(profiles)
          .where(eq(profiles.id, userId))
        return row?.timezone ?? 'America/Sao_Paulo'
      })
    },
    lastCheckIns(professionalId, patientIds) {
      if (patientIds.length === 0) {
        return Promise.resolve([])
      }
      return withUser(db, professionalId, (tx) =>
        tx
          .selectDistinctOn([checkIns.userId], {
            patientId: checkIns.userId,
            moodLevel: checkIns.moodLevel,
            recordedAt: checkIns.recordedAt,
          })
          .from(checkIns)
          .where(inArray(checkIns.userId, patientIds))
          .orderBy(checkIns.userId, desc(checkIns.recordedAt)),
      )
    },
    async checkInStats(professionalId, patientIds, now) {
      if (patientIds.length === 0) {
        return new Map()
      }
      const weekAgo = daysBefore(now, 7)
      const twoWeeksAgo = daysBefore(now, 14)
      const rows = await withUser(db, professionalId, (tx) =>
        tx
          .select({
            patientId: checkIns.userId,
            lastWeek:
              sql<number>`count(*) filter (where ${checkIns.recordedAt} >= ${weekAgo}::timestamptz)`.mapWith(
                Number,
              ),
            lastMonth: count(),
            moodAverage: sql<
              number | null
            >`avg(${checkIns.moodLevel}) filter (where ${checkIns.recordedAt} >= ${weekAgo}::timestamptz)`.mapWith(
              Number,
            ),
            previousMoodAverage: sql<
              number | null
            >`avg(${checkIns.moodLevel}) filter (where ${checkIns.recordedAt} >= ${twoWeeksAgo}::timestamptz and ${checkIns.recordedAt} < ${weekAgo}::timestamptz)`.mapWith(
              Number,
            ),
          })
          .from(checkIns)
          .where(
            and(
              inArray(checkIns.userId, patientIds),
              gte(checkIns.recordedAt, new Date(daysBefore(now, 30))),
            ),
          )
          .groupBy(checkIns.userId),
      )
      return new Map(
        rows.map(({ patientId, moodAverage, previousMoodAverage, ...stats }) => [
          patientId,
          {
            ...stats,
            moodAverage: rounded(moodAverage),
            previousMoodAverage: rounded(previousMoodAverage),
          },
        ]),
      )
    },
    latestScreenings(professionalId, patientIds) {
      if (patientIds.length === 0) {
        return Promise.resolve([])
      }
      return withUser(db, professionalId, (tx) =>
        tx
          .selectDistinctOn([assessments.userId, assessments.instrument], {
            patientId: assessments.userId,
            instrument: assessments.instrument,
            totalScore: assessments.totalScore,
            severity: assessments.severity,
            hasRiskFlag: assessments.hasRiskFlag,
            completedAt: assessments.completedAt,
          })
          .from(assessments)
          .where(inArray(assessments.userId, patientIds))
          .orderBy(assessments.userId, assessments.instrument, desc(assessments.completedAt)),
      )
    },
    async activity(professionalId, patientIds, since, timeZone) {
      if (patientIds.length === 0) {
        return []
      }
      const day = sql<string>`to_char((${checkIns.recordedAt} at time zone ${timeZone})::date, 'YYYY-MM-DD')`
      const rows = await withUser(db, professionalId, (tx) =>
        tx
          .select({
            day,
            checkIns: count(),
            patients: countDistinct(checkIns.userId),
            moodAverage: sql<number | null>`avg(${checkIns.moodLevel})`.mapWith(Number),
          })
          .from(checkIns)
          .where(and(inArray(checkIns.userId, patientIds), gte(checkIns.recordedAt, since)))
          .groupBy(sql`1`)
          .orderBy(sql`1`),
      )
      return rows.map((row) => ({ ...row, moodAverage: rounded(row.moodAverage) }))
    },
    recentCheckIns(professionalId, patientIds, limit) {
      if (patientIds.length === 0) {
        return Promise.resolve([])
      }
      return withUser(db, professionalId, (tx) =>
        tx
          .select({
            patientId: checkIns.userId,
            name: profiles.displayName,
            moodLevel: checkIns.moodLevel,
            emotions: checkIns.emotions,
            contexts: checkIns.contexts,
            recordedAt: checkIns.recordedAt,
          })
          .from(checkIns)
          .innerJoin(profiles, eq(profiles.id, checkIns.userId))
          .where(inArray(checkIns.userId, patientIds))
          .orderBy(desc(checkIns.recordedAt))
          .limit(limit),
      )
    },
    invitationCounts(professionalId) {
      return withUser(db, professionalId, async (tx) => {
        const [row] = await tx
          .select({
            pending:
              sql<number>`count(*) filter (where ${invitations.status} = 'pending' and ${invitations.expiresAt} > now())`.mapWith(
                Number,
              ),
            expiringSoon:
              sql<number>`count(*) filter (where ${invitations.status} = 'pending' and ${invitations.expiresAt} > now() and ${invitations.expiresAt} <= now() + interval '24 hours')`.mapWith(
                Number,
              ),
          })
          .from(invitations)
          .where(eq(invitations.professionalId, professionalId))
        return row ?? { pending: 0, expiringSoon: 0 }
      })
    },
  }
}
