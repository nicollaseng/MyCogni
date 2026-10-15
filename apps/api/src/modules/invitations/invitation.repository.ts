import type { InvitationChannel, InvitationStatus, ProfessionalKind } from '@mycogni/domain'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { asAnonymous, withUser } from '../../db/rls.ts'
import {
  careLinks,
  invitations,
  notifications,
  professionalProfiles,
} from '../../db/schema/index.ts'

export interface InvitationRecord {
  id: string
  code: string
  channel: InvitationChannel
  recipientEmail: string | null
  status: InvitationStatus
  createdAt: Date
  expiresAt: Date
  respondedAt: Date | null
}

export interface ProfessionalSummaryRecord {
  name: string
  kind: ProfessionalKind
  registration: string | null
}

export interface ReceivedInvitationRecord {
  id: string
  professional: ProfessionalSummaryRecord
  status: InvitationStatus
  createdAt: Date
  expiresAt: Date
  respondedAt: Date | null
}

export interface InvitationPreviewRecord {
  professionalName: string
  professionalKind: ProfessionalKind
  professionalAvatarPath: string | null
  status: InvitationStatus
  expiresAt: Date
}

export interface NewInvitation {
  code: string
  channel: InvitationChannel
  recipientEmail: string | null
  createdAt: Date
  expiresAt: Date
}

export interface Acceptance {
  sharesHistory: boolean
  consentVersion: string
}

export type AcceptOutcome =
  | { kind: 'accepted'; linkId: string }
  | { kind: 'not_found' }
  | { kind: 'not_pending' }
  | { kind: 'already_linked' }

export class DuplicateInvitationCodeError extends Error {
  constructor() {
    super('Invitation code already in use')
    this.name = 'DuplicateInvitationCodeError'
  }
}

export interface InvitationRepository {
  create(professionalId: string, invitation: NewInvitation): Promise<InvitationRecord>
  listSent(professionalId: string): Promise<InvitationRecord[]>
  findSent(professionalId: string, id: string): Promise<InvitationRecord | undefined>
  cancel(professionalId: string, id: string): Promise<boolean>
  preview(code: string): Promise<InvitationPreviewRecord | undefined>
  claim(userId: string, code: string): Promise<string | null>
  attach(userId: string): Promise<number>
  listReceived(patientId: string): Promise<ReceivedInvitationRecord[]>
  findReceived(patientId: string, id: string): Promise<ReceivedInvitationRecord | undefined>
  accept(patientId: string, id: string, acceptance: Acceptance): Promise<AcceptOutcome>
  decline(patientId: string, id: string): Promise<boolean>
}

const sentColumns = {
  id: invitations.id,
  code: invitations.code,
  channel: invitations.channel,
  recipientEmail: invitations.recipientEmail,
  status: invitations.status,
  createdAt: invitations.createdAt,
  expiresAt: invitations.expiresAt,
  respondedAt: invitations.respondedAt,
}

const receivedColumns = {
  id: invitations.id,
  professional: {
    name: professionalProfiles.fullName,
    kind: professionalProfiles.kind,
    registration: professionalProfiles.registration,
  },
  status: invitations.status,
  createdAt: invitations.createdAt,
  expiresAt: invitations.expiresAt,
  respondedAt: invitations.respondedAt,
}

function isUniqueViolation(error: unknown): boolean {
  const cause: unknown = error instanceof Error ? error.cause : undefined
  return typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '23505'
}

const stillPending = sql`${invitations.status} = 'pending' and ${invitations.expiresAt} > now()`

export function createInvitationRepository(db: Database): InvitationRepository {
  function receivedQuery(patientId: string) {
    return withUser(db, patientId, (tx) =>
      tx
        .select(receivedColumns)
        .from(invitations)
        .innerJoin(
          professionalProfiles,
          eq(professionalProfiles.userId, invitations.professionalId),
        )
        .where(eq(invitations.patientId, patientId))
        .orderBy(desc(invitations.createdAt)),
    )
  }

  async function markInvitationRead(tx: Transaction, patientId: string, id: string): Promise<void> {
    await tx
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.invitationId, id),
          eq(notifications.userId, patientId),
          isNull(notifications.readAt),
        ),
      )
  }

  return {
    async create(professionalId, invitation) {
      try {
        return await withUser(db, professionalId, async (tx) => {
          const [row] = await tx
            .insert(invitations)
            .values({ ...invitation, professionalId })
            .returning(sentColumns)
          if (row === undefined) {
            throw new Error('Invitation was not saved')
          }
          return row
        })
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new DuplicateInvitationCodeError()
        }
        throw error
      }
    },
    listSent(professionalId) {
      return withUser(db, professionalId, (tx) =>
        tx
          .select(sentColumns)
          .from(invitations)
          .where(eq(invitations.professionalId, professionalId))
          .orderBy(desc(invitations.createdAt))
          .limit(200),
      )
    },
    findSent(professionalId, id) {
      return withUser(db, professionalId, async (tx) => {
        const [row] = await tx
          .select(sentColumns)
          .from(invitations)
          .where(and(eq(invitations.id, id), eq(invitations.professionalId, professionalId)))
        return row
      })
    },
    cancel(professionalId, id) {
      return withUser(db, professionalId, async (tx) => {
        const rows = await tx
          .update(invitations)
          .set({ status: 'canceled', respondedAt: new Date() })
          .where(
            and(
              eq(invitations.id, id),
              eq(invitations.professionalId, professionalId),
              eq(invitations.status, 'pending'),
            ),
          )
          .returning({ id: invitations.id })
        return rows.length > 0
      })
    },
    preview(code) {
      return asAnonymous(db, async (tx) => {
        const rows = await tx.execute<{
          professional_name: string
          professional_kind: ProfessionalKind
          professional_avatar_path: string | null
          status: InvitationStatus
          expires_at: string
        }>(sql`select * from public.invitation_preview(${code})`)
        const [row] = Array.from(rows)
        return row === undefined
          ? undefined
          : {
              professionalName: row.professional_name,
              professionalKind: row.professional_kind,
              professionalAvatarPath: row.professional_avatar_path,
              status: row.status,
              expiresAt: new Date(row.expires_at),
            }
      })
    },
    claim(userId, code) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute<{ id: string | null }>(
          sql`select public.claim_invitation(${code}) as id`,
        )
        return Array.from(rows)[0]?.id ?? null
      })
    },
    attach(userId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute<{ attached: number }>(
          sql`select public.attach_invitations_by_email() as attached`,
        )
        return Array.from(rows)[0]?.attached ?? 0
      })
    },
    listReceived(patientId) {
      return receivedQuery(patientId)
    },
    async findReceived(patientId, id) {
      const rows = await receivedQuery(patientId)
      return rows.find((row) => row.id === id)
    },
    async accept(patientId, id, { sharesHistory, consentVersion }) {
      try {
        return await withUser(db, patientId, async (tx): Promise<AcceptOutcome> => {
          const [invitation] = await tx
            .select({ professionalId: invitations.professionalId, pending: stillPending })
            .from(invitations)
            .where(and(eq(invitations.id, id), eq(invitations.patientId, patientId)))
          if (invitation === undefined) {
            return { kind: 'not_found' }
          }
          if (!invitation.pending) {
            return { kind: 'not_pending' }
          }
          const [active] = await tx
            .select({ id: careLinks.id })
            .from(careLinks)
            .where(
              and(
                eq(careLinks.professionalId, invitation.professionalId),
                eq(careLinks.patientId, patientId),
                isNull(careLinks.endedAt),
              ),
            )
          if (active !== undefined) {
            return { kind: 'already_linked' }
          }
          await tx
            .update(invitations)
            .set({ status: 'accepted', respondedAt: new Date() })
            .where(eq(invitations.id, id))
          const [link] = await tx
            .insert(careLinks)
            .values({
              professionalId: invitation.professionalId,
              patientId,
              invitationId: id,
              sharesHistory,
              consentVersion,
            })
            .returning({ id: careLinks.id })
          if (link === undefined) {
            throw new Error('Care link was not created')
          }
          await markInvitationRead(tx, patientId, id)
          return { kind: 'accepted', linkId: link.id }
        })
      } catch (error) {
        if (isUniqueViolation(error)) {
          return { kind: 'already_linked' }
        }
        throw error
      }
    },
    decline(patientId, id) {
      return withUser(db, patientId, async (tx) => {
        const rows = await tx
          .update(invitations)
          .set({ status: 'declined', respondedAt: new Date() })
          .where(and(eq(invitations.id, id), eq(invitations.patientId, patientId), stillPending))
          .returning({ id: invitations.id })
        if (rows.length > 0) {
          await markInvitationRead(tx, patientId, id)
        }
        return rows.length > 0
      })
    },
  }
}
