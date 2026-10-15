import type { AccountType } from '@mycogni/domain'
import type { ContinueTarget } from './continue-path'

export type HomePath = '/pro' | '/today'

export type Destination = HomePath | ContinueTarget

export function homePathOf(type: AccountType): HomePath {
  return type === 'professional' ? '/pro' : '/today'
}

export function destinationOf(type: AccountType, intent: ContinueTarget | null): Destination {
  if (intent === null) {
    return homePathOf(type)
  }
  const forProfessionals = intent === '/pro/join'
  if (type === 'professional') {
    return forProfessionals ? intent : '/pro'
  }
  return forProfessionals ? '/today' : intent
}
