import type { Metadata } from 'next'
import { submitScreening } from '@/features/screening/actions'
import { RetakeFlow } from '@/features/screening/components/retake-flow'
import { latestByInstrument } from '@/features/screening/latest'
import { fetchAssessments } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export const metadata: Metadata = { title: 'Questionários' }

export default async function QuestionnairesPage() {
  const profile = await requireOnboardedProfile()
  const previous = latestByInstrument(await fetchAssessments())
  return <RetakeFlow previous={previous} timeZone={profile.timezone} send={submitScreening} />
}
