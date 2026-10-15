import type { AccountExport } from '@mycogni/contracts'
import type { AccountAdmin } from '../../auth/account-admin.ts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError } from '../../shared/errors.ts'
import { toAssessment } from '../assessments/assessment.service.ts'
import { toCheckIn } from '../check-ins/check-in.service.ts'
import { toConsent } from '../consents/consent.service.ts'
import { toProfile } from '../profile/profile.service.ts'
import type { AccountRepository } from './account.repository.ts'

export interface AccountService {
  export(user: AuthenticatedUser): Promise<AccountExport>
  delete(user: AuthenticatedUser): Promise<void>
}

interface AccountDependencies {
  repository: AccountRepository
  admin: AccountAdmin
  now?: () => Date
}

export function createAccountService({
  repository,
  admin,
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
        consents: data.consents.map(toConsent),
        assessments: data.assessments.map((record) => ({
          ...toAssessment(record),
          answers: record.answers,
        })),
        checkIns: data.checkIns.map(toCheckIn),
      }
    },
    delete(user) {
      return admin.deleteUser(user.id)
    },
  }
}
