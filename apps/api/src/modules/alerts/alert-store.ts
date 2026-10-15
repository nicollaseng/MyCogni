import type { AlertLevel, AlertReason, ScreeningResult } from '@mycogni/domain'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'
import { authUsers } from 'drizzle-orm/supabase'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  assessments,
  careLinks,
  insights,
  professionalAlerts,
  professionalProfiles,
  profiles,
} from '../../db/schema/index.ts'

export interface AlertLink {
  careLinkId: string
  professionalId: string
  patientId: string
  startedAt: Date
}

export interface NewAlert {
  link: AlertLink
  reason: AlertReason
  level: AlertLevel
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
  professionalSummary(insightId: string): Promise<ProfessionalSummaryRecord | undefined>
  raise(alert: NewAlert, cooldownSince: Date | null): Promise<string | null>
  claimEmail(alertId: string, link: AlertLink, window: EmailWindow): Promise<boolean>
  releaseEmail(alertId: string): Promise<void>
  recipient(link: AlertLink): Promise<AlertRecipient | undefined>
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
    raise({ link, reason, level }, cooldownSince) {
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
