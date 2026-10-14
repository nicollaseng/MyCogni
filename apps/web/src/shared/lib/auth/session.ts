import { redirect } from 'next/navigation'
import { fetchProfile } from '../api/resources'
import { createSupabaseServerClient } from '../supabase/server'

export interface SessionUser {
  id: string
  email: string | null
}

export async function currentUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.auth.getClaims()
  if (data === null) {
    return null
  }
  const { claims } = data
  return { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await currentUser()
  if (user === null) {
    redirect('/sign-in')
  }
  return user
}

export async function requireOnboardedUser(): Promise<SessionUser> {
  const user = await requireUser()
  const profile = await fetchProfile()
  if (profile.onboardingCompletedAt === null) {
    redirect('/onboarding')
  }
  return user
}

export async function redirectSignedInUser(): Promise<void> {
  if ((await currentUser()) !== null) {
    redirect('/today')
  }
}
