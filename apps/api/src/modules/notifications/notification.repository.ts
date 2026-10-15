import type { InvitationStatus, NotificationKind, ProfessionalKind } from '@mycogni/domain'
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { invitations, notifications, professionalProfiles } from '../../db/schema/index.ts'

export interface NotificationRecord {
  id: string
  kind: NotificationKind
  createdAt: Date
  readAt: Date | null
  invitation: {
    id: string
    status: InvitationStatus
    expiresAt: Date
    professionalName: string
    professionalKind: ProfessionalKind
  } | null
}

export interface NotificationRepository {
  list(userId: string, limit: number): Promise<NotificationRecord[]>
  unread(userId: string): Promise<number>
  markRead(userId: string, ids: string[] | undefined): Promise<void>
}

export function createNotificationRepository(db: Database): NotificationRepository {
  return {
    async list(userId, limit) {
      const rows = await withUser(db, userId, (tx) =>
        tx
          .select({
            id: notifications.id,
            kind: notifications.kind,
            createdAt: notifications.createdAt,
            readAt: notifications.readAt,
            invitationId: invitations.id,
            invitationStatus: invitations.status,
            invitationExpiresAt: invitations.expiresAt,
            professionalName: professionalProfiles.fullName,
            professionalKind: professionalProfiles.kind,
          })
          .from(notifications)
          .leftJoin(invitations, eq(invitations.id, notifications.invitationId))
          .leftJoin(
            professionalProfiles,
            eq(professionalProfiles.userId, invitations.professionalId),
          )
          .where(eq(notifications.userId, userId))
          .orderBy(desc(notifications.createdAt))
          .limit(limit),
      )
      return rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        createdAt: row.createdAt,
        readAt: row.readAt,
        invitation:
          row.invitationId === null ||
          row.invitationStatus === null ||
          row.invitationExpiresAt === null ||
          row.professionalName === null ||
          row.professionalKind === null
            ? null
            : {
                id: row.invitationId,
                status: row.invitationStatus,
                expiresAt: row.invitationExpiresAt,
                professionalName: row.professionalName,
                professionalKind: row.professionalKind,
              },
      }))
    },
    unread(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({ total: count() })
          .from(notifications)
          .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
        return row?.total ?? 0
      })
    },
    async markRead(userId, ids) {
      await withUser(db, userId, (tx) =>
        tx
          .update(notifications)
          .set({ readAt: new Date() })
          .where(
            and(
              eq(notifications.userId, userId),
              isNull(notifications.readAt),
              ids === undefined ? undefined : inArray(notifications.id, ids),
            ),
          ),
      )
    },
  }
}
