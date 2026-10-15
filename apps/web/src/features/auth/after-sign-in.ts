import { attachInvitations } from '@/shared/lib/api/care'
import { continuePath, type ContinueTarget } from '@/shared/lib/auth/continue-path'
import { homePath, type HomePath } from '@/shared/lib/auth/home-path'
import type { EmailLinkType } from './email-link'
import { forgetPendingEmail } from './pending-email'

export async function afterSignIn(): Promise<ContinueTarget | HomePath> {
  try {
    await attachInvitations()
  } catch (cause) {
    console.error(cause)
  }
  return (await continuePath()) ?? (await homePath())
}

export async function afterEmailLink(
  type: EmailLinkType,
): Promise<ContinueTarget | HomePath | '/new-password'> {
  if (type === 'recovery') {
    return '/new-password'
  }
  await forgetPendingEmail()
  return afterSignIn()
}
