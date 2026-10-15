import type {
  Locale,
  SupportAttachmentType,
  SupportRequesterRole,
  SupportSubject,
  SupportTicketStatus,
} from '@mycogni/domain'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { professionalProfiles, profiles, supportTickets } from '../../db/schema/index.ts'

export interface SupportAttachmentRecord {
  fileName: string
  contentType: SupportAttachmentType
  sizeBytes: number
}

export interface SupportTicketRecord {
  id: string
  number: number
  subject: SupportSubject
  customSubject: string | null
  message: string
  role: SupportRequesterRole
  status: SupportTicketStatus
  attachment: SupportAttachmentRecord | null
  closingNote: string | null
  createdAt: Date
  takenAt: Date | null
  closedAt: Date | null
}

export interface AdminSupportTicketRecord extends SupportTicketRecord {
  locale: Locale
  requesterName: string | null
  requesterEmail: string | null
}

export interface NewSupportTicket {
  role: SupportRequesterRole
  subject: SupportSubject
  customSubject: string | null
  message: string
  locale: Locale
  attachment: (SupportAttachmentRecord & { path: string }) | null
}

export interface Requester {
  displayName: string | null
  professionalName: string | null
}

export type StatusChange = 'changed' | 'not_found' | 'invalid_transition' | 'forbidden'

export class AttachmentNotStoredError extends Error {
  constructor() {
    super('The attachment is not stored in the folder of this person')
    this.name = 'AttachmentNotStoredError'
  }
}

export interface SupportRepository {
  isAdmin(userId: string): Promise<boolean>
  requester(userId: string): Promise<Requester>
  create(userId: string, ticket: NewSupportTicket): Promise<SupportTicketRecord>
  list(userId: string): Promise<SupportTicketRecord[]>
  find(userId: string, id: string): Promise<SupportTicketRecord | undefined>
  listForAdmin(
    adminId: string,
    status: SupportTicketStatus | undefined,
  ): Promise<AdminSupportTicketRecord[]>
  findForAdmin(adminId: string, id: string): Promise<AdminSupportTicketRecord | undefined>
  attachmentPath(adminId: string, id: string): Promise<string | null | undefined>
  changeStatus(
    adminId: string,
    id: string,
    status: SupportTicketStatus,
    note: string | null,
  ): Promise<StatusChange>
}

interface AdminRow extends Record<string, unknown> {
  id: string
  number: number
  requester_role: SupportRequesterRole
  subject: SupportSubject
  custom_subject: string | null
  message: string
  attachment_name: string | null
  attachment_type: SupportAttachmentType | null
  attachment_size: number | null
  status: SupportTicketStatus
  locale: Locale
  closing_note: string | null
  created_at: string
  taken_at: string | null
  closed_at: string | null
  requester_name: string | null
  requester_email: string | null
}

const columns = {
  id: supportTickets.id,
  number: supportTickets.number,
  subject: supportTickets.subject,
  customSubject: supportTickets.customSubject,
  message: supportTickets.message,
  role: supportTickets.requesterRole,
  status: supportTickets.status,
  attachmentName: supportTickets.attachmentName,
  attachmentType: supportTickets.attachmentType,
  attachmentSize: supportTickets.attachmentSize,
  closingNote: supportTickets.closingNote,
  createdAt: supportTickets.createdAt,
  takenAt: supportTickets.takenAt,
  closedAt: supportTickets.closedAt,
}

interface TicketRow {
  attachmentName: string | null
  attachmentType: SupportAttachmentType | null
  attachmentSize: number | null
}

function attachmentOf({
  attachmentName,
  attachmentType,
  attachmentSize,
}: TicketRow): SupportAttachmentRecord | null {
  return attachmentName === null || attachmentType === null || attachmentSize === null
    ? null
    : { fileName: attachmentName, contentType: attachmentType, sizeBytes: attachmentSize }
}

type TicketColumns = TicketRow & Omit<SupportTicketRecord, 'attachment'>

function toRecord(row: TicketColumns): SupportTicketRecord {
  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    customSubject: row.customSubject,
    message: row.message,
    role: row.role,
    status: row.status,
    attachment: attachmentOf(row),
    closingNote: row.closingNote,
    createdAt: row.createdAt,
    takenAt: row.takenAt,
    closedAt: row.closedAt,
  }
}

function dateOf(value: string | null): Date | null {
  return value === null ? null : new Date(value)
}

function toAdminRecord(row: AdminRow): AdminSupportTicketRecord {
  return {
    id: row.id,
    number: row.number,
    subject: row.subject,
    customSubject: row.custom_subject,
    message: row.message,
    role: row.requester_role,
    status: row.status,
    attachment: attachmentOf({
      attachmentName: row.attachment_name,
      attachmentType: row.attachment_type,
      attachmentSize: row.attachment_size,
    }),
    closingNote: row.closing_note,
    createdAt: new Date(row.created_at),
    takenAt: dateOf(row.taken_at),
    closedAt: dateOf(row.closed_at),
    locale: row.locale,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
  }
}

function databaseCode(error: unknown): string {
  const cause: unknown = error instanceof Error ? error.cause : undefined
  return typeof cause === 'object' &&
    cause !== null &&
    'code' in cause &&
    typeof cause.code === 'string'
    ? cause.code
    : 'unknown'
}

export function createSupportRepository(db: Database): SupportRepository {
  function adminRows(adminId: string, status: SupportTicketStatus | null, id: string | null) {
    return withUser(db, adminId, async (tx) =>
      Array.from(
        await tx.execute<AdminRow>(
          sql`select * from public.support_tickets_for_admin(${status}::public.support_ticket_status, ${id}::uuid)`,
        ),
      ).map(toAdminRecord),
    )
  }

  return {
    isAdmin(userId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx.execute<{ admin: boolean }>(sql`select public.is_admin() as admin`)
        return Array.from(rows)[0]?.admin === true
      })
    },
    requester(userId) {
      return withUser(db, userId, async (tx) => {
        const [profile] = await tx
          .select({ displayName: profiles.displayName })
          .from(profiles)
          .where(eq(profiles.id, userId))
        const [professional] = await tx
          .select({ fullName: professionalProfiles.fullName })
          .from(professionalProfiles)
          .where(eq(professionalProfiles.userId, userId))
        return {
          displayName: profile?.displayName ?? null,
          professionalName: professional?.fullName ?? null,
        }
      })
    },
    async create(userId, { attachment, role, ...ticket }) {
      const saved = await withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(supportTickets)
          .values({
            ...ticket,
            userId,
            requesterRole: role,
            attachmentPath: attachment?.path ?? null,
            attachmentName: attachment?.fileName ?? null,
            attachmentType: attachment?.contentType ?? null,
            attachmentSize: attachment?.sizeBytes ?? null,
          })
          .returning(columns)
        return row
      }).then(
        (row) => ({ row, code: null }),
        (error: unknown) => ({ row: undefined, code: databaseCode(error) }),
      )
      if (saved.code === '42501') {
        throw new AttachmentNotStoredError()
      }
      if (saved.row === undefined) {
        throw new Error(`Support ticket was not saved (${saved.code ?? 'no row'})`)
      }
      return toRecord(saved.row)
    },
    async list(userId) {
      const rows = await withUser(db, userId, (tx) =>
        tx
          .select(columns)
          .from(supportTickets)
          .where(eq(supportTickets.userId, userId))
          .orderBy(desc(supportTickets.createdAt)),
      )
      return rows.map(toRecord)
    },
    async find(userId, id) {
      const [row] = await withUser(db, userId, (tx) =>
        tx
          .select(columns)
          .from(supportTickets)
          .where(and(eq(supportTickets.userId, userId), eq(supportTickets.id, id))),
      )
      return row === undefined ? undefined : toRecord(row)
    },
    listForAdmin(adminId, status) {
      return adminRows(adminId, status ?? null, null)
    },
    async findForAdmin(adminId, id) {
      return (await adminRows(adminId, null, id))[0]
    },
    async attachmentPath(adminId, id) {
      const [row] = await withUser(db, adminId, (tx) =>
        tx
          .select({ path: supportTickets.attachmentPath })
          .from(supportTickets)
          .where(eq(supportTickets.id, id)),
      )
      return row?.path
    },
    changeStatus(adminId, id, status, note) {
      return withUser(db, adminId, async (tx) => {
        const rows = await tx.execute<{ outcome: StatusChange }>(
          sql`select public.change_support_ticket_status(${id}, ${status}, ${note}) as outcome`,
        )
        return Array.from(rows)[0]?.outcome ?? 'not_found'
      })
    },
  }
}
