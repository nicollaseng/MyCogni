import type {
  InvitationStatus,
  NotificationKind,
  ProfessionalKind,
  ProfessionalStatus,
  SupportTicketStatus,
} from '@mycogni/domain'
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  careLinks,
  invitations,
  notifications,
  professionalProfiles,
  profiles,
  questionnaireAssignments,
  professionalReviews,
  supportTickets,
} from '../../db/schema/index.ts'

const linkedProfessional = alias(professionalProfiles, 'linked_professional')

export interface NotificationRecord {
  id: string
  kind: NotificationKind
  createdAt: Date
  readAt: Date | null
  insightId: string | null
  supportTicket: { id: string; number: number; status: SupportTicketStatus } | null
  invitation: {
    id: string
    status: InvitationStatus
    expiresAt: Date
    professionalName: string
    professionalKind: ProfessionalKind
  } | null
  questionnaire: { assignmentId: string; patientId: string; patientName: string | null } | null
  review: { decision: ProfessionalStatus; note: string | null } | null
  unavailableProfessional: { name: string } | null
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
            insightId: notifications.insightId,
            supportTicketId: supportTickets.id,
            supportNumber: supportTickets.number,
            supportStatus: notifications.supportStatus,
            invitationId: invitations.id,
            invitationStatus: invitations.status,
            invitationExpiresAt: invitations.expiresAt,
            professionalName: professionalProfiles.fullName,
            professionalKind: professionalProfiles.kind,
            questionnaireId: questionnaireAssignments.id,
            questionnairePatientId: questionnaireAssignments.patientId,
            questionnairePatientName: profiles.displayName,
            reviewDecision: professionalReviews.decision,
            reviewNote: professionalReviews.note,
            unavailableName: linkedProfessional.fullName,
          })
          .from(notifications)
          .leftJoin(invitations, eq(invitations.id, notifications.invitationId))
          .leftJoin(supportTickets, eq(supportTickets.id, notifications.supportTicketId))
          .leftJoin(
            professionalProfiles,
            eq(professionalProfiles.userId, invitations.professionalId),
          )
          .leftJoin(
            questionnaireAssignments,
            eq(questionnaireAssignments.id, notifications.questionnaireAssignmentId),
          )
          .leftJoin(profiles, eq(profiles.id, questionnaireAssignments.patientId))
          .leftJoin(
            professionalReviews,
            eq(professionalReviews.id, notifications.professionalReviewId),
          )
          .leftJoin(careLinks, eq(careLinks.id, notifications.careLinkId))
          .leftJoin(linkedProfessional, eq(linkedProfessional.userId, careLinks.professionalId))
          .where(eq(notifications.userId, userId))
          .orderBy(desc(notifications.createdAt))
          .limit(limit),
      )
      return rows.map((row) => ({
        id: row.id,
        kind: row.kind,
        createdAt: row.createdAt,
        readAt: row.readAt,
        insightId: row.insightId,
        supportTicket:
          row.supportTicketId === null || row.supportNumber === null || row.supportStatus === null
            ? null
            : { id: row.supportTicketId, number: row.supportNumber, status: row.supportStatus },
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
        questionnaire:
          row.questionnaireId === null || row.questionnairePatientId === null
            ? null
            : {
                assignmentId: row.questionnaireId,
                patientId: row.questionnairePatientId,
                patientName: row.questionnairePatientName,
              },
        review:
          row.reviewDecision === null
            ? null
            : { decision: row.reviewDecision, note: row.reviewNote },
        unavailableProfessional:
          row.unavailableName === null ? null : { name: row.unavailableName },
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
