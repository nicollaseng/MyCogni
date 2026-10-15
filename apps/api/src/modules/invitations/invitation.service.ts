import type {
  AcceptInvitationInput,
  CareLink,
  CreatedInvitation,
  CreateInvitationInput,
  InvitationPreview,
  ReceivedInvitation,
  SentInvitation,
} from '@mycogni/contracts'
import {
  effectiveStatus,
  generateInvitationCode,
  invitationExpiry,
  type Locale,
} from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { Mailer } from '../../mail/mailer.ts'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { CareLinkRepository } from '../care-links/care-link.repository.ts'
import { toCareLink } from '../care-links/care-link.service.ts'
import type { ProfessionalRepository } from '../professionals/professional.repository.ts'
import { invitationEmail } from './invitation-email.ts'
import {
  DuplicateInvitationCodeError,
  type InvitationRecord,
  type InvitationRepository,
  type NewInvitation,
  type ReceivedInvitationRecord,
} from './invitation.repository.ts'

export interface InvitationService {
  create(user: AuthenticatedUser, input: CreateInvitationInput): Promise<CreatedInvitation>
  resend(user: AuthenticatedUser, id: string, locale: Locale): Promise<CreatedInvitation>
  listSent(user: AuthenticatedUser): Promise<SentInvitation[]>
  cancel(user: AuthenticatedUser, id: string): Promise<void>
  preview(code: string): Promise<InvitationPreview>
  claim(user: AuthenticatedUser, code: string): Promise<ReceivedInvitation>
  attach(user: AuthenticatedUser): Promise<number>
  listReceived(user: AuthenticatedUser): Promise<ReceivedInvitation[]>
  findReceived(user: AuthenticatedUser, id: string): Promise<ReceivedInvitation>
  accept(user: AuthenticatedUser, id: string, input: AcceptInvitationInput): Promise<CareLink>
  decline(user: AuthenticatedUser, id: string): Promise<void>
}

export interface InvitationDependencies {
  invitations: InvitationRepository
  professionals: ProfessionalRepository
  careLinks: CareLinkRepository
  mailer: Mailer
  webUrl: string
  pickIndex: (size: number) => number
  now: () => Date
}

const codeAttempts = 5

export function createInvitationService({
  invitations,
  professionals,
  careLinks,
  mailer,
  webUrl,
  pickIndex,
  now,
}: InvitationDependencies): InvitationService {
  function linkTo(code: string): string {
    return `${webUrl}/invite/${code}`
  }

  function toSent(record: InvitationRecord): SentInvitation {
    return {
      ...record,
      status: effectiveStatus(record, now()),
      createdAt: record.createdAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      respondedAt: record.respondedAt?.toISOString() ?? null,
      link: linkTo(record.code),
    }
  }

  function toReceived(record: ReceivedInvitationRecord): ReceivedInvitation {
    return {
      ...record,
      status: effectiveStatus(record, now()),
      createdAt: record.createdAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
      respondedAt: record.respondedAt?.toISOString() ?? null,
    }
  }

  async function verifiedProfessionalName(user: AuthenticatedUser): Promise<string> {
    const professional = await professionals.find(user.id)
    if (professional?.status !== 'verified') {
      throw new ForbiddenError('Only verified professionals can invite patients')
    }
    return professional.fullName
  }

  async function insertWithFreshCode(
    professionalId: string,
    invitation: Omit<NewInvitation, 'code'>,
    attempt = 1,
  ): Promise<InvitationRecord> {
    try {
      return await invitations.create(professionalId, {
        ...invitation,
        code: generateInvitationCode(pickIndex),
      })
    } catch (error) {
      if (error instanceof DuplicateInvitationCodeError && attempt < codeAttempts) {
        return insertWithFreshCode(professionalId, invitation, attempt + 1)
      }
      throw error
    }
  }

  async function issue(
    user: AuthenticatedUser,
    recipientEmail: string | null,
    locale: Locale,
  ): Promise<CreatedInvitation> {
    const professionalName = await verifiedProfessionalName(user)
    const createdAt = now()
    const record = await insertWithFreshCode(user.id, {
      channel: recipientEmail === null ? 'link' : 'email',
      recipientEmail,
      createdAt,
      expiresAt: invitationExpiry(createdAt),
    })
    const emailSent =
      recipientEmail !== null &&
      (await mailer.send(
        invitationEmail({
          to: recipientEmail,
          locale,
          professionalName,
          link: linkTo(record.code),
        }),
      ))
    return { invitation: toSent(record), emailSent }
  }

  async function receivedOrFail(user: AuthenticatedUser, id: string): Promise<ReceivedInvitation> {
    const record = await invitations.findReceived(user.id, id)
    if (record === undefined) {
      throw new NotFoundError('Invitation not found')
    }
    return toReceived(record)
  }

  return {
    create(user, input) {
      return issue(user, input.channel === 'email' ? input.recipientEmail : null, input.locale)
    },
    async resend(user, id, locale) {
      const previous = await invitations.findSent(user.id, id)
      if (previous === undefined) {
        throw new NotFoundError('Invitation not found')
      }
      const status = effectiveStatus(previous, now())
      if (status !== 'pending' && status !== 'expired') {
        throw new ConflictError('Only pending or expired invitations can be sent again')
      }
      await invitations.cancel(user.id, id)
      return issue(user, previous.recipientEmail, locale)
    },
    async listSent(user) {
      return (await invitations.listSent(user.id)).map(toSent)
    },
    async cancel(user, id) {
      if (!(await invitations.cancel(user.id, id))) {
        throw new NotFoundError('No pending invitation with this id')
      }
    },
    async preview(code) {
      const record = await invitations.preview(code)
      if (record === undefined) {
        throw new NotFoundError('Invitation not found')
      }
      return {
        professional: { name: record.professionalName, kind: record.professionalKind },
        status: record.status,
        expiresAt: record.expiresAt.toISOString(),
      }
    },
    async claim(user, code) {
      const id = await invitations.claim(user.id, code)
      if (id === null) {
        throw new NotFoundError('This invitation is not available')
      }
      return receivedOrFail(user, id)
    },
    attach(user) {
      return invitations.attach(user.id)
    },
    async listReceived(user) {
      return (await invitations.listReceived(user.id)).map(toReceived)
    },
    findReceived(user, id) {
      return receivedOrFail(user, id)
    },
    async accept(user, id, input) {
      const outcome = await invitations.accept(user.id, id, input)
      switch (outcome.kind) {
        case 'not_found':
          throw new NotFoundError('Invitation not found')
        case 'not_pending':
          throw new ConflictError('This invitation is no longer pending')
        case 'already_linked':
          throw new ConflictError('You already share your records with this professional')
        case 'accepted': {
          const link = await careLinks.findForPatient(user.id, outcome.linkId)
          if (link === undefined) {
            throw new NotFoundError('Care link not found')
          }
          return toCareLink(link)
        }
      }
    },
    async decline(user, id) {
      if (!(await invitations.decline(user.id, id))) {
        throw new ConflictError('This invitation is no longer pending')
      }
    },
  }
}
