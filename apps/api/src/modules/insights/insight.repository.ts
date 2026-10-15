import type { PatientInsightContent, ProfessionalInsightContent } from '@mycogni/contracts'
import type { InsightAudience } from '@mycogni/domain'
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  careLinks,
  consents,
  insights,
  journalEntries,
  notifications,
  profiles,
} from '../../db/schema/index.ts'

export interface InsightSubject {
  timezone: string
  locale: string | null
  journalInInsights: boolean
  aiConsent: boolean
}

export interface LinkedProfessional {
  professionalId: string
  locale: string | null
}

export interface JournalExcerpt {
  title: string | null
  plainText: string
  updatedAt: Date
}

export interface NewInsight {
  patientId: string
  audience: InsightAudience
  professionalId: string | null
  periodStart: Date
  periodEnd: Date
  checkInCount: number
  content: PatientInsightContent | ProfessionalInsightContent
  model: string
}

export interface InsightRecord {
  id: string
  periodStart: Date
  periodEnd: Date
  checkInCount: number
  content: unknown
  createdAt: Date
}

export interface InsightRepository {
  subject(patientId: string): Promise<InsightSubject | undefined>
  lastPatientInsightEnd(patientId: string): Promise<Date | null>
  journal(patientId: string, since: Date, limit: number): Promise<JournalExcerpt[]>
  linkedProfessionals(patientId: string): Promise<LinkedProfessional[]>
  save(insight: NewInsight): Promise<string>
  listForPatient(patientId: string, limit: number): Promise<InsightRecord[]>
  listForProfessional(
    professionalId: string,
    patientId: string,
    limit: number,
  ): Promise<InsightRecord[]>
}

const recordColumns = {
  id: insights.id,
  periodStart: insights.periodStart,
  periodEnd: insights.periodEnd,
  checkInCount: insights.checkInCount,
  content: sql<unknown>`${insights.content}`,
  createdAt: insights.createdAt,
}

export function createInsightRepository(db: Database): InsightRepository {
  return {
    subject(patientId) {
      return withUser(db, patientId, async (tx) => {
        const [profile] = await tx
          .select({
            timezone: profiles.timezone,
            locale: profiles.locale,
            journalInInsights: profiles.journalInInsights,
          })
          .from(profiles)
          .where(eq(profiles.id, patientId))
        if (profile === undefined) {
          return undefined
        }
        const [consent] = await tx
          .select({ kind: consents.kind })
          .from(consents)
          .where(
            and(
              eq(consents.userId, patientId),
              eq(consents.kind, 'ai_processing'),
              isNull(consents.revokedAt),
            ),
          )
        return { ...profile, aiConsent: consent !== undefined }
      })
    },
    lastPatientInsightEnd(patientId) {
      return withUser(db, patientId, async (tx) => {
        const [row] = await tx
          .select({ periodEnd: insights.periodEnd })
          .from(insights)
          .where(and(eq(insights.patientId, patientId), eq(insights.audience, 'patient')))
          .orderBy(desc(insights.periodEnd))
          .limit(1)
        return row?.periodEnd ?? null
      })
    },
    journal(patientId, since, limit) {
      return withUser(db, patientId, (tx) =>
        tx
          .select({
            title: journalEntries.title,
            plainText: journalEntries.plainText,
            updatedAt: journalEntries.updatedAt,
          })
          .from(journalEntries)
          .where(and(eq(journalEntries.userId, patientId), gte(journalEntries.updatedAt, since)))
          .orderBy(desc(journalEntries.updatedAt))
          .limit(limit),
      )
    },
    linkedProfessionals(patientId) {
      return db
        .select({ professionalId: careLinks.professionalId, locale: profiles.locale })
        .from(careLinks)
        .innerJoin(profiles, eq(profiles.id, careLinks.professionalId))
        .where(and(eq(careLinks.patientId, patientId), isNull(careLinks.endedAt)))
    },
    async save(insight) {
      return db.transaction(async (tx) => {
        const [row] = await tx.insert(insights).values(insight).returning({ id: insights.id })
        if (row === undefined) {
          throw new Error('Insight was not saved')
        }
        if (insight.audience === 'patient') {
          await tx
            .insert(notifications)
            .values({ userId: insight.patientId, kind: 'insight', insightId: row.id })
        }
        return row.id
      })
    },
    listForPatient(patientId, limit) {
      return withUser(db, patientId, (tx) =>
        tx
          .select(recordColumns)
          .from(insights)
          .where(and(eq(insights.patientId, patientId), eq(insights.audience, 'patient')))
          .orderBy(desc(insights.createdAt))
          .limit(limit),
      )
    },
    listForProfessional(professionalId, patientId, limit) {
      return withUser(db, professionalId, (tx) =>
        tx
          .select(recordColumns)
          .from(insights)
          .where(
            and(
              eq(insights.patientId, patientId),
              eq(insights.audience, 'professional'),
              eq(insights.professionalId, professionalId),
            ),
          )
          .orderBy(desc(insights.createdAt))
          .limit(limit),
      )
    },
  }
}
