import type {
  AdminSupportQuery,
  AdminSupportTicket,
  ChangeSupportStatusInput,
  CreatedSupportTicket,
  CreateSupportTicketInput,
  DocumentLink,
  SupportTicket,
} from '@mycogni/contracts'
import {
  isOwnSupportAttachmentPath,
  supportAttachmentName,
  supportLimits,
  type SupportRequesterRole,
} from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { Mailer } from '../../mail/mailer.ts'
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnprocessableError,
} from '../../shared/errors.ts'
import type { RateLimiter } from '../../shared/rate-limiter.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { supportInboxEmail, ticketOpenedEmail, ticketStatusEmail } from './support-email.ts'
import {
  AttachmentNotStoredError,
  type AdminSupportTicketRecord,
  type SupportRepository,
  type SupportTicketRecord,
} from './support.repository.ts'

export interface SupportService {
  create(user: AuthenticatedUser, input: CreateSupportTicketInput): Promise<CreatedSupportTicket>
  list(user: AuthenticatedUser): Promise<SupportTicket[]>
  find(user: AuthenticatedUser, id: string): Promise<SupportTicket>
  listForAdmin(user: AuthenticatedUser, query: AdminSupportQuery): Promise<AdminSupportTicket[]>
  findForAdmin(user: AuthenticatedUser, id: string): Promise<AdminSupportTicket>
  attachmentLink(user: AuthenticatedUser, id: string): Promise<DocumentLink>
  changeStatus(
    user: AuthenticatedUser,
    id: string,
    input: ChangeSupportStatusInput,
  ): Promise<AdminSupportTicket>
}

export interface SupportDependencies {
  repository: SupportRepository
  attachments: BucketStore
  mailer: Mailer
  limiter: RateLimiter
  webUrl: string
  supportEmail: string
  linkLifetimeSeconds: number
  now: () => Date
}

function toTicket(record: SupportTicketRecord): SupportTicket {
  return {
    id: record.id,
    number: record.number,
    subject: record.subject,
    customSubject: record.customSubject,
    message: record.message,
    role: record.role,
    status: record.status,
    attachment: record.attachment,
    closingNote: record.closingNote,
    createdAt: record.createdAt.toISOString(),
    takenAt: record.takenAt?.toISOString() ?? null,
    closedAt: record.closedAt?.toISOString() ?? null,
  }
}

function toAdminTicket(record: AdminSupportTicketRecord): AdminSupportTicket {
  return {
    ...toTicket(record),
    locale: record.locale,
    requester: { name: record.requesterName, email: record.requesterEmail },
  }
}

const statusErrors = {
  forbidden: () => new ForbiddenError('Only the MyCogniAI team can answer tickets'),
  not_found: () => new NotFoundError('Ticket not found'),
  invalid_transition: () => new ConflictError('The ticket cannot move to this status'),
}

export function createSupportService({
  repository,
  attachments,
  mailer,
  limiter,
  webUrl,
  supportEmail,
  linkLifetimeSeconds,
  now,
}: SupportDependencies): SupportService {
  function ticketLink(role: SupportRequesterRole, id: string): string {
    return `${webUrl}${role === 'professional' ? '/pro' : ''}/support/${id}`
  }

  async function requireAdmin(user: AuthenticatedUser): Promise<void> {
    if (!(await repository.isAdmin(user.id))) {
      throw new ForbiddenError('Only the MyCogniAI team can answer tickets')
    }
  }

  async function adminTicketOrFail(
    user: AuthenticatedUser,
    id: string,
  ): Promise<AdminSupportTicketRecord> {
    const record = await repository.findForAdmin(user.id, id)
    if (record === undefined) {
      throw new NotFoundError('Ticket not found')
    }
    return record
  }

  async function validate(user: AuthenticatedUser, input: CreateSupportTicketInput) {
    const requester = await repository.requester(user.id)
    if (input.role === 'professional' && requester.professionalName === null) {
      throw new ForbiddenError('Only professionals can open tickets from the professional area')
    }
    if (input.attachment !== null && !isOwnSupportAttachmentPath(input.attachment.path, user.id)) {
      throw new UnprocessableError('The attachment must be stored in your own folder')
    }
    const allowed = await limiter.consume(`support-ticket:${user.id}`, {
      limit: supportLimits.ticketsPerWindow,
      windowSeconds: supportLimits.windowSeconds,
    })
    if (!allowed) {
      throw new TooManyRequestsError(
        'SUPPORT_TICKET_LIMIT',
        'You opened many tickets today. Wait a little before opening another one.',
      )
    }
    return input.role === 'professional'
      ? (requester.professionalName ?? requester.displayName)
      : (requester.displayName ?? requester.professionalName)
  }

  async function save(user: AuthenticatedUser, input: CreateSupportTicketInput) {
    try {
      return await repository.create(user.id, {
        role: input.role,
        subject: input.subject,
        customSubject: input.customSubject,
        message: input.message,
        locale: input.locale,
        attachment:
          input.attachment === null
            ? null
            : {
                ...input.attachment,
                fileName: supportAttachmentName(
                  input.attachment.fileName,
                  input.attachment.contentType,
                ),
              },
      })
    } catch (error) {
      if (error instanceof AttachmentNotStoredError) {
        throw new UnprocessableError('Upload the attachment before sending the ticket')
      }
      throw error
    }
  }

  return {
    async create(user, input) {
      const requesterName = await validate(user, input)
      const record = await save(user, input)
      const link = ticketLink(record.role, record.id)
      const [, emailSent] = await Promise.all([
        mailer.send(
          supportInboxEmail({
            to: supportEmail,
            number: record.number,
            subject: record.subject,
            customSubject: record.customSubject,
            message: record.message,
            role: record.role,
            locale: input.locale,
            requesterName,
            requesterEmail: user.email,
            attachment: record.attachment,
            link: `${webUrl}/admin/support/${record.id}`,
          }),
        ),
        user.email === null
          ? Promise.resolve(false)
          : mailer.send(
              ticketOpenedEmail({
                to: user.email,
                locale: input.locale,
                number: record.number,
                subject: record.subject,
                link,
                replyTo: supportEmail,
              }),
            ),
      ])
      return { ticket: toTicket(record), emailSent }
    },
    async list(user) {
      return (await repository.list(user.id)).map(toTicket)
    },
    async find(user, id) {
      const record = await repository.find(user.id, id)
      if (record === undefined) {
        throw new NotFoundError('Ticket not found')
      }
      return toTicket(record)
    },
    async listForAdmin(user, query) {
      await requireAdmin(user)
      return (await repository.listForAdmin(user.id, query.status)).map(toAdminTicket)
    },
    async findForAdmin(user, id) {
      await requireAdmin(user)
      return toAdminTicket(await adminTicketOrFail(user, id))
    },
    async attachmentLink(user, id) {
      await requireAdmin(user)
      const path = await repository.attachmentPath(user.id, id)
      if (path === undefined || path === null) {
        throw new NotFoundError('Attachment not found')
      }
      const url = (await attachments.sign([path]))[path]
      if (url === undefined) {
        throw new NotFoundError('Attachment file not found')
      }
      return {
        url,
        expiresAt: new Date(now().getTime() + linkLifetimeSeconds * 1000).toISOString(),
      }
    },
    async changeStatus(user, id, input) {
      await requireAdmin(user)
      const note = input.status === 'closed' ? (input.note ?? null) : null
      const outcome = await repository.changeStatus(user.id, id, input.status, note)
      if (outcome !== 'changed') {
        throw statusErrors[outcome]()
      }
      const record = await adminTicketOrFail(user, id)
      if (record.requesterEmail !== null) {
        await mailer.send(
          ticketStatusEmail({
            to: record.requesterEmail,
            locale: record.locale,
            number: record.number,
            subject: record.subject,
            link: ticketLink(record.role, record.id),
            replyTo: supportEmail,
            status: input.status,
            note: record.closingNote,
          }),
        )
      }
      return toAdminTicket(record)
    },
  }
}
