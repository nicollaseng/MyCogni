import type { Profile } from '@mycogni/contracts'
import { consentVersion, isOnboardingReady } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { NotFoundError, UnprocessableError } from '../../shared/errors.ts'
import type { AssessmentRepository } from '../assessments/assessment.repository.ts'
import type { ConsentRepository } from '../consents/consent.repository.ts'
import type { ProfileRepository } from '../profile/profile.repository.ts'
import { toProfile } from '../profile/profile.service.ts'

export interface OnboardingService {
  complete(user: AuthenticatedUser): Promise<Profile>
}

interface OnboardingDependencies {
  profiles: ProfileRepository
  consents: ConsentRepository
  assessments: AssessmentRepository
}

export function createOnboardingService({
  profiles,
  consents,
  assessments,
}: OnboardingDependencies): OnboardingService {
  return {
    async complete(user) {
      const [granted, completedInstruments] = await Promise.all([
        consents.findGranted(user.id, consentVersion),
        assessments.completedInstruments(user.id),
      ])
      const grantedConsents = granted.map((consent) => consent.kind)
      if (!isOnboardingReady({ grantedConsents, completedInstruments })) {
        throw new UnprocessableError(
          'Grant the required consents and answer both screenings before finishing onboarding',
        )
      }
      const record = await profiles.completeOnboarding(user.id)
      if (record === undefined) {
        throw new NotFoundError('Profile not found')
      }
      return toProfile(record, user)
    },
  }
}
