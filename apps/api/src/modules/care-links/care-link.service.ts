import type { CareLink } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { CareLinkRecord, CareLinkRepository } from './care-link.repository.ts'

export interface CareLinkService {
  list(user: AuthenticatedUser): Promise<CareLink[]>
  end(user: AuthenticatedUser, id: string): Promise<void>
}

export function toCareLink(record: CareLinkRecord): CareLink {
  return { ...record, startedAt: record.startedAt.toISOString() }
}

export function createCareLinkService(repository: CareLinkRepository): CareLinkService {
  return {
    async list(user) {
      return (await repository.listForPatient(user.id)).map(toCareLink)
    },
    async end(user, id) {
      if (!(await repository.end(user.id, id))) {
        throw new NotFoundError('No active link with this id')
      }
    },
  }
}
