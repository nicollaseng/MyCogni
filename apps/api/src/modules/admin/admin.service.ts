import type {
  DocumentLink,
  ProfessionalForReview,
  ProfessionalReviewDetail,
  ProfessionalReviewQuery,
  ReviewProfessionalInput,
} from '@mycogni/contracts'
import {
  councilOf,
  defaultLocale,
  isLocale,
  needsRegistrationReview,
  registrationLabel,
} from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { Mailer } from '../../mail/mailer.ts'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { signedUrlOf } from '../../storage/profile-files.ts'
import { toDocument } from '../professionals/professional.service.ts'
import type { AdminRepository, ProfessionalForReviewRecord } from './admin.repository.ts'
import { reviewEmail } from './review-email.ts'

export interface AdminService {
  professionals(
    user: AuthenticatedUser,
    query: ProfessionalReviewQuery,
  ): Promise<ProfessionalForReview[]>
  professional(user: AuthenticatedUser, professionalId: string): Promise<ProfessionalReviewDetail>
  review(
    user: AuthenticatedUser,
    professionalId: string,
    input: ReviewProfessionalInput,
  ): Promise<void>
  documentLink(user: AuthenticatedUser, documentId: string): Promise<DocumentLink>
}

export interface AdminDependencies {
  repository: AdminRepository
  documents: BucketStore
  photos: BucketStore
  mailer: Mailer
  webUrl: string
  linkLifetimeSeconds: number
  now: () => Date
}

function toForReview(record: ProfessionalForReviewRecord): ProfessionalForReview {
  return {
    userId: record.userId,
    kind: record.kind,
    fullName: record.fullName,
    registration: registrationLabel(record.registration),
    council: councilOf(record.kind),
    registrationNeedsReview: needsRegistrationReview(record.kind, record.registration),
    email: record.email,
    status: record.status,
    reviewNote: record.reviewNote,
    createdAt: record.createdAt.toISOString(),
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
    reviewedAt: record.reviewedAt?.toISOString() ?? null,
    hasPhoto: record.avatarPath !== null,
    activeLinks: record.activeLinks,
    pendingInvitations: record.pendingInvitations,
    document: record.document === null ? null : toDocument(record.document),
  }
}

export function createAdminService({
  repository,
  documents,
  photos,
  mailer,
  webUrl,
  linkLifetimeSeconds,
  now,
}: AdminDependencies): AdminService {
  async function requireAdmin(user: AuthenticatedUser): Promise<void> {
    if (!(await repository.isAdmin(user.id))) {
      throw new ForbiddenError('Only the MyCogniAI team can review professionals')
    }
  }

  async function professionalOrFail(
    user: AuthenticatedUser,
    professionalId: string,
  ): Promise<ProfessionalForReviewRecord> {
    const record = await repository.professional(user.id, professionalId)
    if (record === undefined) {
      throw new NotFoundError('Professional not found')
    }
    return record
  }

  async function tell(
    before: ProfessionalForReviewRecord,
    { status, note }: ReviewProfessionalInput,
  ): Promise<void> {
    if (before.status === status || before.email === null) {
      return
    }
    const reason = note?.trim() ?? ''
    await mailer.send(
      reviewEmail({
        to: before.email,
        locale: isLocale(before.locale) ? before.locale : defaultLocale,
        decision: status,
        note: reason === '' ? null : reason,
        link: `${webUrl}/pro`,
      }),
    )
  }

  return {
    async professionals(user, query) {
      await requireAdmin(user)
      const records = await repository.professionals(user.id, query.status)
      return records.map(toForReview)
    },
    async professional(user, professionalId) {
      await requireAdmin(user)
      const record = await professionalOrFail(user, professionalId)
      const [photoUrl, history] = await Promise.all([
        signedUrlOf(photos, record.avatarPath),
        repository.history(user.id, professionalId),
      ])
      return {
        ...toForReview(record),
        photoUrl,
        history: history.map((entry) => ({ ...entry, createdAt: entry.createdAt.toISOString() })),
      }
    },
    async review(user, professionalId, input) {
      await requireAdmin(user)
      const before = await professionalOrFail(user, professionalId)
      const outcome = await repository.review(user.id, professionalId, {
        status: input.status,
        note: input.note ?? null,
      })
      if (outcome === 'no_document') {
        throw new ConflictError('The professional has not sent a registration document yet')
      }
      if (outcome === 'no_photo') {
        throw new ConflictError('The professional has not added a profile photo yet')
      }
      if (outcome === 'not_found') {
        throw new NotFoundError('Professional not found')
      }
      await tell(before, input)
    },
    async documentLink(user, documentId) {
      await requireAdmin(user)
      const path = await repository.documentPath(user.id, documentId)
      if (path === undefined) {
        throw new NotFoundError('Document not found')
      }
      const url = (await documents.sign([path]))[path]
      if (url === undefined) {
        throw new NotFoundError('Document file not found')
      }
      return {
        url,
        expiresAt: new Date(now().getTime() + linkLifetimeSeconds * 1000).toISOString(),
      }
    },
  }
}
