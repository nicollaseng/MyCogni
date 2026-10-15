import { attachInvitations } from '@/shared/lib/api/care'
import { continuePath, type ContinueTarget } from '@/shared/lib/auth/continue-path'
import { homePath, type HomePath } from '@/shared/lib/auth/home-path'

export async function afterSignIn(): Promise<ContinueTarget | HomePath> {
  try {
    await attachInvitations()
  } catch (cause) {
    console.error(cause)
  }
  return (await continuePath()) ?? (await homePath())
}
