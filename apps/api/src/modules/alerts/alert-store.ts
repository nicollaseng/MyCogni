import type { AlertLevel, AlertReason, ScreeningResult } from '@mycogni/domain'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  assessments,
  careLinks,
  checkInAddenda,
  checkIns,
  insights,
  journalEntries,
  professionalAlerts,
  professionalProfiles,
  profiles,
  questionnaireResponses,
} from '../../db/schema/index.ts'
import type { SavedNote } from '../../jobs/alert-trigger.ts'

export interface AlertLink {
  careLinkId: string
  professionalId: string
  patientId: string
  startedAt: Date
}

export interface AlertSubject {
  checkInId: string | null
  journalEntryId: string | null
}

export interface NewAlert {
  link: AlertLink
  reason: AlertReason
  level: AlertLevel
  subject: AlertSubject
}

export interface ProfessionalSummaryRecord {
  professionalId: string
  patientId: string
  content: unknown
}

export interface AlertRecipient {
  email: string
  locale: string | null
  patientName: string | null
}

export interface EmailWindow {
  since: Date
  at: Date
}

export interface AlertStore {
  activeLinks(filter: { patientId?: string; professionalId?: string }): Promise<AlertLink[]>
  visibleScreening(link: AlertLink, assessmentId: string): Promise<ScreeningResult | undefined>
  visibleNote(link: AlertLink, note: SavedNote): Promise<boolean>
  visibleQuestionnaire(
    link: AlertLink,
    responseId: string,
  ): Promise<{ hasRiskFlag: boolean } | undefined>
  professionalSummary(insightId: string): Promise<ProfessionalSummaryRecord | undefined>
  raise(alert: NewAlert, cooldownSince: Date | null): Promise<string | null>
  claimEmail(alertId: string, link: AlertLink, window: EmailWindow): Promise<boolean>
  releaseEmail(alertId: string): Promise<void>
  recipient(link: AlertLink): Promise<AlertRecipient | undefined>
}

function readableNote(tx: Transaction, patientId: string, note: SavedNote) {
  switch (note.kind) {
    case 'check_in':
      return tx
        .select({ id: checkIns.id })
        .from(checkIns)
        .where(and(eq(checkIns.id, note.checkInId), eq(checkIns.userId, patientId)))
    case 'addendum':
      return tx
        .select({ id: checkInAddenda.id })
        .from(checkInAddenda)
        .where(
          and(
            eq(checkInAddenda.id, note.addendumId),
            eq(checkInAddenda.checkInId, note.checkInId),
            eq(checkInAddenda.userId, patientId),
          ),
        )
    case 'journal':
      return tx
        .select({ id: journalEntries.id })
        .from(journalEntries)
        .where(and(eq(journalEntries.id, note.entryId), eq(journalEntries.userId, patientId)))
  }
}

export function createAlertStore(db: Database): AlertStore {
  return {
    activeLinks({ patientId, professionalId }) {
      return db
        .select({
          careLinkId: careLinks.id,
          professionalId: careLinks.professionalId,
          patientId: careLinks.patientId,
          startedAt: careLinks.startedAt,
        })
        .from(careLinks)
        .innerJoin(
          professionalProfiles,
          and(
            eq(professionalProfiles.userId, careLinks.professionalId),
            eq(professionalProfiles.status, 'verified'),
          ),
        )
        .where(
          and(
            isNull(careLinks.endedAt),
            patientId === undefined ? undefined : eq(careLinks.patientId, patientId),
            professionalId === undefined ? undefined : eq(careLinks.professionalId, professionalId),
          ),
        )
        .orderBy(careLinks.professionalId)
    },
    visibleScreening(link, assessmentId) {
      return withUser(db, link.professionalId, async (tx) => {
        const [row] = await tx
          .select({
            instrument: assessments.instrument,
            severity: assessments.severity,
            hasRiskFlag: assessments.hasRiskFlag,
          })
          .from(assessments)
          .where(and(eq(assessments.id, assessmentId), eq(assessments.userId, link.patientId)))
        return row
      })
    },
    visibleQuestionnaire(link, responseId) {
      return withUser(db, link.professionalId, async (tx) => {
        const [row] = await tx
          .select({ flags: questionnaireResponses.flags })
          .from(questionnaireResponses)
          .where(
            and(
              eq(questionnaireResponses.id, responseId),
              eq(questionnaireResponses.patientId, link.patientId),
            ),
          )
        return row === undefined ? undefined : { hasRiskFlag: row.flags.includes('risk_item') }
      })
    },
    visibleNote(link, note) {
      return withUser(db, link.professionalId, async (tx) => {
        const rows = await readableNote(tx, link.patientId, note)
        return rows.length > 0
      })
    },
    async professionalSummary(insightId) {
      const [row] = await db
        .select({
          professionalId: insights.professionalId,
          patientId: insights.patientId,
          content: sql<unknown>`${insights.content}`,
        })
        .from(insights)
        .where(and(eq(insights.id, insightId), eq(insights.audience, 'professional')))
      if (row === undefined || row.professionalId === null) {
        return undefined
      }
      return { ...row, professionalId: row.professionalId }
    },
    raise({ link, reason, level, subject }, cooldownSince) {
      return db.transaction(async (tx) => {
        if (cooldownSince !== null) {
          const [recent] = await tx
            .select({ id: professionalAlerts.id })
            .from(professionalAlerts)
            .where(
              and(
                eq(professionalAlerts.careLinkId, link.careLinkId),
                eq(professionalAlerts.reason, reason),
                gt(professionalAlerts.createdAt, cooldownSince),
              ),
            )
            .limit(1)
          if (recent !== undefined) {
            return null
          }
        }
        const [row] = await tx
          .insert(professionalAlerts)
          .values({
            careLinkId: link.careLinkId,
            professionalId: link.professionalId,
            patientId: link.patientId,
            reason,
            level,
            ...subject,
          })
          .onConflictDoNothing({
            target: [professionalAlerts.careLinkId, professionalAlerts.reason],
            where: sql`resolved_at is null`,
          })
          .returning({ id: professionalAlerts.id })
        return row?.id ?? null
      })
    },
    claimEmail(alertId, link, { since, at }) {
      return db.transaction(async (tx) => {
        const pair = `${link.professionalId}/${link.patientId}`
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${pair}, 0))`)
        const [recent] = await tx
          .select({ id: professionalAlerts.id })
          .from(professionalAlerts)
          .where(
            and(
              eq(professionalAlerts.professionalId, link.professionalId),
              eq(professionalAlerts.patientId, link.patientId),
              gt(professionalAlerts.emailedAt, since),
            ),
          )
          .limit(1)
        if (recent !== undefined) {
          return false
        }
        await tx
          .update(professionalAlerts)
          .set({ emailedAt: at })
          .where(eq(professionalAlerts.id, alertId))
        return true
      })
    },
    async releaseEmail(alertId) {
      await db
        .update(professionalAlerts)
        .set({ emailedAt: null })
        .where(eq(professionalAlerts.id, alertId))
    },
    async recipient(link) {
      const [professional] = await db
        .select({ email: authUsers.email, locale: profiles.locale })
        .from(authUsers)
        .leftJoin(profiles, eq(profiles.id, authUsers.id))
        .where(eq(authUsers.id, link.professionalId))
      if (professional === undefined || professional.email === null) {
        return undefined
      }
      const [patient] = await db
        .select({ name: profiles.displayName })
        .from(profiles)
        .where(eq(profiles.id, link.patientId))
      return {
        email: professional.email,
        locale: professional.locale,
        patientName: patient?.name ?? null,
      }
    },
  }
}
