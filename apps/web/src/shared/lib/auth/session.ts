import type { Profile } from '@mycogni/contracts'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { ApiError } from '../api/client'
import { fetchProfile } from '../api/resources'
import { createSupabaseServerClient } from '../supabase/server'
import { continuePath } from './continue-path'
import { destinationOf } from './destination'
import { currentAccountType } from './account-type'

export interface SessionUser {
  id: string
  email: string | null
}

export const currentUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient('read-only')
  const { data } = await supabase.auth.getClaims()
  if (data === null) {
    return null
  }
  const { claims } = data
  return { id: claims.sub, email: typeof claims.email === 'string' ? claims.email : null }
})

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

export async function requirePatientProfile(): Promise<Profile> {
  await requireUser()
  const profile = await requireProfile()
  if (profile.accountType !== 'patient') {
    redirect('/pro')
  }
  return profile
}

export async function requireOnboardedProfile(): Promise<Profile> {
  const profile = await requirePatientProfile()
  if (profile.onboardingCompletedAt === null) {
    redirect('/onboarding')
  }
  if (profile.termsOutdated) {
    redirect('/accept-terms')
  }
  return profile
}

export async function redirectSignedInUser(): Promise<void> {
  if ((await currentUser()) !== null) {
    redirect(destinationOf(await currentAccountType(), await continuePath()))
  }
}
