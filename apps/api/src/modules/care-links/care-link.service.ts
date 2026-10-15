import type { CareLink } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { toCareLinks } from './care-link.mapper.ts'
import type { CareLinkRepository } from './care-link.repository.ts'

export interface CareLinkService {
  list(user: AuthenticatedUser): Promise<CareLink[]>
  end(user: AuthenticatedUser, id: string): Promise<void>
}

export function createCareLinkService(
  repository: CareLinkRepository,
  photos: BucketStore,
): CareLinkService {
  return {
    async list(user) {
      return toCareLinks(await repository.listForPatient(user.id), photos)
    },
    async end(user, id) {
      if (!(await repository.end(user.id, id))) {
        throw new NotFoundError('No active link with this id')
      }
    },
  }
}
