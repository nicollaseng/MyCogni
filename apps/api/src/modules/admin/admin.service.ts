import type {
  DocumentLink,
  ProfessionalForReview,
  ProfessionalReviewQuery,
  ReviewProfessionalInput,
} from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { toDocument } from '../professionals/professional.service.ts'
import type { AdminRepository } from './admin.repository.ts'

export interface AdminService {
  professionals(
    user: AuthenticatedUser,
    query: ProfessionalReviewQuery,
  ): Promise<ProfessionalForReview[]>
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
  linkLifetimeSeconds: number
  now: () => Date
}

export function createAdminService({
  repository,
  documents,
  linkLifetimeSeconds,
  now,
}: AdminDependencies): AdminService {
  async function requireAdmin(user: AuthenticatedUser): Promise<void> {
    if (!(await repository.isAdmin(user.id))) {
      throw new ForbiddenError('Only the MyCogniAI team can review professionals')
    }
  }

  return {
    async professionals(user, query) {
      await requireAdmin(user)
      const records = await repository.professionals(user.id, query.status)
      return records.map((record) => ({
        ...record,
        createdAt: record.createdAt.toISOString(),
        verifiedAt: record.verifiedAt?.toISOString() ?? null,
        reviewedAt: record.reviewedAt?.toISOString() ?? null,
        document: record.document === null ? null : toDocument(record.document),
      }))
    },
    async review(user, professionalId, input) {
      await requireAdmin(user)
      const outcome = await repository.review(user.id, professionalId, {
        status: input.status,
        note: input.note ?? null,
      })
      if (outcome === 'no_document') {
        throw new ConflictError('The professional has not sent a registration document yet')
      }
      if (outcome === 'not_found') {
        throw new NotFoundError('Professional not found')
      }
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
