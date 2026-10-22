import type { AccountExport } from '@mycogni/contracts'
import type { AccountAdmin } from '../../auth/account-admin.ts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError } from '../../shared/errors.ts'
import type { BucketStore } from '../../storage/bucket-store.ts'
import { toAssessment } from '../assessments/assessment.service.ts'
import { toCheckIn } from '../check-ins/check-in.service.ts'
import { toConsent } from '../consents/consent.service.ts'
import { toMemory } from '../memories/memory.service.ts'
import { toProfile } from '../profile/profile.service.ts'
import type { AccountRepository } from './account.repository.ts'

export interface AccountService {
  export(user: AuthenticatedUser): Promise<AccountExport>
  delete(user: AuthenticatedUser): Promise<void>
}

interface AccountDependencies {
  repository: AccountRepository
  admin: AccountAdmin
  buckets: readonly BucketStore[]
  now?: () => Date
}

export function createAccountService({
  repository,
  admin,
  buckets,
  now = () => new Date(),
}: AccountDependencies): AccountService {
  return {
    async export(user) {
      const data = await repository.collect(user.id)
      if (data.profile === undefined) {
        throw new NotFoundError('Profile not found')
      }
      return {
        exportedAt: now().toISOString(),
        profile: toProfile(data.profile, user),
        consents: data.consents.map((record) => ({
          ...toConsent(record),
          revokedAt: record.revokedAt?.toISOString() ?? null,
        })),
        assessments: data.assessments.map((record) => ({
          ...toAssessment(record),
          answers: record.answers,
        })),
        checkIns: data.checkIns.map(toCheckIn),
        memories: data.memories.map(toMemory),
      }
    },
    async delete(user) {
      await Promise.all(buckets.map((bucket) => bucket.removeFolder(user.id)))
      await admin.deleteUser(user.id)
    },
  }
}
