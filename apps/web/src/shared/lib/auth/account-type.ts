import type { AccountType } from '@mycogni/domain'
import { fetchProfile } from '../api/resources'

export async function currentAccountType(): Promise<AccountType> {
  try {
    return (await fetchProfile()).accountType
  } catch (cause) {
    console.error(cause)
    return 'patient'
  }
}
