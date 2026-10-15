import type { AlertLevel, AlertReason } from '@mycogni/domain'
import { and, desc, eq, isNull, sql, type SQL } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { professionalAlerts, profiles } from '../../db/schema/index.ts'

export interface AlertRecord {
  id: string
  patientId: string
  patientName: string | null
  reason: AlertReason
  level: AlertLevel
  createdAt: Date
  acknowledgedAt: Date | null
  resolvedAt: Date | null
}

export interface AlertCountRecord {
  pending: number
  urgent: number
}

export interface AlertFilter {
  patientId?: string
  limit: number
}

export interface AlertRepository {
  list(professionalId: string, filter: AlertFilter): Promise<AlertRecord[]>
  count(professionalId: string): Promise<AlertCountRecord>
  acknowledge(professionalId: string, id: string): Promise<boolean>
  resolve(professionalId: string, id: string): Promise<boolean>
}

export function createAlertRepository(db: Database): AlertRepository {
  function mark(
    professionalId: string,
    id: string,
    changes: { acknowledgedAt: SQL; resolvedAt?: SQL },
  ) {
    return withUser(db, professionalId, async (tx) => {
      const rows = await tx
        .update(professionalAlerts)
        .set(changes)
        .where(and(eq(professionalAlerts.id, id), isNull(professionalAlerts.resolvedAt)))
        .returning({ id: professionalAlerts.id })
      return rows.length > 0
    })
  }

  const firstSeen = sql`coalesce(${professionalAlerts.acknowledgedAt}, now())`

  return {
    list(professionalId, { patientId, limit }) {
      return withUser(db, professionalId, (tx) =>
        tx
          .select({
            id: professionalAlerts.id,
            patientId: professionalAlerts.patientId,
            patientName: profiles.displayName,
            reason: professionalAlerts.reason,
            level: professionalAlerts.level,
            createdAt: professionalAlerts.createdAt,
            acknowledgedAt: professionalAlerts.acknowledgedAt,
            resolvedAt: professionalAlerts.resolvedAt,
          })
          .from(professionalAlerts)
          .leftJoin(profiles, eq(profiles.id, professionalAlerts.patientId))
          .where(
            and(
              eq(professionalAlerts.professionalId, professionalId),
              patientId === undefined ? undefined : eq(professionalAlerts.patientId, patientId),
            ),
          )
          .orderBy(
            sql`${professionalAlerts.resolvedAt} is null desc`,
            desc(professionalAlerts.createdAt),
          )
          .limit(limit),
      )
    },
    count(professionalId) {
      return withUser(db, professionalId, async (tx) => {
        const [row] = await tx
          .select({
            pending: sql<number>`count(*)`.mapWith(Number),
            urgent:
              sql<number>`count(*) filter (where ${professionalAlerts.level} = 'urgent')`.mapWith(
                Number,
              ),
          })
          .from(professionalAlerts)
          .where(
            and(
              eq(professionalAlerts.professionalId, professionalId),
              isNull(professionalAlerts.resolvedAt),
            ),
          )
        return row ?? { pending: 0, urgent: 0 }
      })
    },
    acknowledge(professionalId, id) {
      return mark(professionalId, id, { acknowledgedAt: firstSeen })
    },
    resolve(professionalId, id) {
      return mark(professionalId, id, { acknowledgedAt: firstSeen, resolvedAt: sql`now()` })
    },
  }
}
