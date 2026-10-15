import type { Consent, GrantConsentsInput } from '@mycogni/contracts'
import { consentVersion, isPatientConsent, isRevocable, type ConsentKind } from '@mycogni/domain'
import type { AccountTypeReader } from '../../auth/account-types.ts'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import { AccountTypeError, UnprocessableError } from '../../shared/errors.ts'
import type { ConsentRecord, ConsentRepository } from './consent.repository.ts'

export interface ConsentService {
  list(user: AuthenticatedUser): Promise<Consent[]>
  grant(user: AuthenticatedUser, input: GrantConsentsInput): Promise<Consent[]>
  revoke(user: AuthenticatedUser, kind: ConsentKind): Promise<void>
}

export function toConsent(record: ConsentRecord): Consent {
  return {
    kind: record.kind,
    version: record.version,
    grantedAt: record.grantedAt.toISOString(),
  }
}

export function createConsentService(
  repository: ConsentRepository,
  accountTypes: AccountTypeReader,
): ConsentService {
  async function list(user: AuthenticatedUser): Promise<Consent[]> {
    const records = await repository.findGranted(user.id, consentVersion)
    return records.map(toConsent)
  }

  return {
    list,
    async grant(user, input) {
      if (
        input.kinds.some(isPatientConsent) &&
        (await accountTypes.typeOf(user.id)) !== 'patient'
      ) {
        throw new AccountTypeError('patient')
      }
      await repository.grant(user.id, [...new Set(input.kinds)], consentVersion)
      return list(user)
    },
    async revoke(user, kind) {
      if (!isRevocable(kind)) {
        throw new UnprocessableError(
          'This consent is required to use the app; delete the account to withdraw it',
        )
      }
      await repository.revoke(user.id, kind, consentVersion)
    },
  }
}
