import type { Consent, GrantConsentsInput } from '@mycogni/contracts'
import { consentVersion } from '@mycogni/domain'
import type { AuthenticatedUser } from '../../auth/token-verifier.ts'
import type { ConsentRecord, ConsentRepository } from './consent.repository.ts'

export interface ConsentService {
  list(user: AuthenticatedUser): Promise<Consent[]>
  grant(user: AuthenticatedUser, input: GrantConsentsInput): Promise<Consent[]>
}

export function toConsent(record: ConsentRecord): Consent {
  return {
    kind: record.kind,
    version: record.version,
    grantedAt: record.grantedAt.toISOString(),
  }
}

export function createConsentService(repository: ConsentRepository): ConsentService {
  async function list(user: AuthenticatedUser): Promise<Consent[]> {
    const records = await repository.findGranted(user.id, consentVersion)
    return records.map(toConsent)
  }

  return {
    list,
    async grant(user, input) {
      await repository.grant(user.id, [...new Set(input.kinds)], consentVersion)
      return list(user)
    },
  }
}
