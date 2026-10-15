import type { Profile } from '@mycogni/contracts'
import { redirect } from 'next/navigation'
import { ApiError } from '../api/client'
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

export async function requireProfile(): Promise<Profile> {
  try {
    return await fetchProfile()
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      redirect('/auth/session-ended')
    }
    throw error
  }
}

export async function requireOnboardedProfile(): Promise<Profile> {
  await requireUser()
  const profile = await requireProfile()
  if (profile.onboardingCompletedAt === null) {
    redirect('/onboarding')
  }
  return profile
}

export async function redirectSignedInUser(): Promise<void> {
  if ((await currentUser()) !== null) {
    redirect('/today')
  }
}
