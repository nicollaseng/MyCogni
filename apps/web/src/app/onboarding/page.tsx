import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { refreshAfterUpload } from '@/features/account/actions'
import { signOut } from '@/features/auth/actions'
import { acceptConsents, finishOnboarding, saveName } from '@/features/onboarding/actions'
import { OnboardingFlow } from '@/features/onboarding/components/onboarding-flow'
import { resumeFrom } from '@/features/onboarding/model'
import { submitScreening } from '@/features/screening/actions'
import { fetchAssessments, fetchConsents } from '@/shared/lib/api/resources'
import { requireProfile, requireUser } from '@/shared/lib/auth/session'
import { ownPhotoUrl } from '@/shared/lib/photos'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('onboarding.meta')
  return { title: t('title') }
}

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
  const photoUrl = await ownPhotoUrl(profile.avatarPath)

  return (
    <OnboardingFlow
      start={resumeFrom(profile, consents, assessments)}
      actions={{
        acceptConsents,
        saveName,
        submitScreening,
        finishOnboarding,
        photoSaved: refreshAfterUpload,
      }}
      photo={{ url: photoUrl, email: profile.email }}
      signOut={signOut}
    />
  )
}
