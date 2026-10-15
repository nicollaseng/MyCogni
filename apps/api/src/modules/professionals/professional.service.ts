import type { ProfessionalProfile, RegisterProfessionalInput } from '@mycogni/contracts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { ConflictError, NotFoundError } from '../../shared/errors.ts'
import type { ProfessionalRecord, ProfessionalRepository } from './professional.repository.ts'

export interface ProfessionalService {
  get(user: AuthenticatedUser): Promise<ProfessionalProfile>
  register(user: AuthenticatedUser, input: RegisterProfessionalInput): Promise<ProfessionalProfile>
}

function toProfessional(record: ProfessionalRecord): ProfessionalProfile {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    verifiedAt: record.verifiedAt?.toISOString() ?? null,
  }
}

export function createProfessionalService(repository: ProfessionalRepository): ProfessionalService {
  return {
    async get(user) {
      const record = await repository.find(user.id)
      if (record === undefined) {
        throw new NotFoundError('Professional profile not found')
      }
      return toProfessional(record)
    },
    async register(user, input) {
      const record = await repository.create(user.id, input)
      if (record === undefined) {
        throw new ConflictError('Professional profile already exists')
      }
      return toProfessional(record)
    },
  }
}
