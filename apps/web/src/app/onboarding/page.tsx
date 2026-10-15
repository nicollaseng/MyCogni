import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { signOut } from '@/features/auth/actions'
import {
  acceptConsents,
  finishOnboarding,
  saveName,
  submitScreening,
} from '@/features/onboarding/actions'
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow'
import { resumeFrom } from '@/features/onboarding/model'
import { fetchAssessments, fetchConsents } from '@/shared/lib/api/resources'
import { requireProfile, requireUser } from '@/shared/lib/auth/session'

export const metadata: Metadata = { title: 'Primeiros passos' }

export default async function OnboardingPage() {
  await requireUser()
  const [profile, consents, assessments] = await Promise.all([
    requireProfile(),
    fetchConsents(),
    fetchAssessments(),
  ])
  if (profile.onboardingCompletedAt !== null) {
    redirect('/today')
  }

  return (
    <OnboardingFlow
      start={resumeFrom(profile, consents, assessments)}
      actions={{ acceptConsents, saveName, submitScreening, finishOnboarding }}
      signOut={signOut}
    />
  )
}
