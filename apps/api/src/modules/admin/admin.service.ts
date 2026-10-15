import type {
  ProfessionalForReview,
  ProfessionalReviewQuery,
  ReviewProfessionalInput,
} from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ForbiddenError, NotFoundError } from '../../shared/errors.ts'
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
}

export function createAdminService(repository: AdminRepository): AdminService {
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
      }))
    },
    async review(user, professionalId, input) {
      await requireAdmin(user)
      if (!(await repository.review(user.id, professionalId, input.status))) {
        throw new NotFoundError('Professional not found')
      }
    },
  }
}
