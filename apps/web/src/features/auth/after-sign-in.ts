import type { AccountType } from '@mycogni/domain'
import { attachInvitations } from '@/shared/lib/api/care'
import { adoptProfessionalAccount } from '@/shared/lib/api/resources'
import { takeContinuePath, type ContinueTarget } from '@/shared/lib/auth/continue-path'
import { destinationOf, type Destination } from '@/shared/lib/auth/destination'
import { currentAccountType } from '@/shared/lib/auth/account-type'
import type { EmailLinkType } from './email-link'
import { forgetPendingEmail } from './pending-email'

async function attachForPatient(type: AccountType): Promise<void> {
  if (type !== 'patient') {
    return
  }
  try {
    await attachInvitations()
  } catch (cause) {
    console.error(cause)
  }
}

async function arrive(type: AccountType, intent: ContinueTarget | null): Promise<Destination> {
  await attachForPatient(type)
  return destinationOf(type, intent)
}

async function typeAfterAdoption(): Promise<AccountType> {
  try {
    return await adoptProfessionalAccount()
  } catch (cause) {
    console.error(cause)
    return 'patient'
  }
}

export async function afterSignIn(): Promise<Destination> {
  const intent = await takeContinuePath()
  return arrive(await currentAccountType(), intent)
}

export async function afterOAuthSignIn(): Promise<Destination> {
  const intent = await takeContinuePath()
  const type = await currentAccountType()
  const adopts = intent === '/pro/join' && type === 'patient'
  return arrive(adopts ? await typeAfterAdoption() : type, intent)
}

export async function afterEmailLink(type: EmailLinkType): Promise<Destination | '/new-password'> {
  if (type === 'recovery') {
    return '/new-password'
  }
  await forgetPendingEmail()
  return afterSignIn()
}
