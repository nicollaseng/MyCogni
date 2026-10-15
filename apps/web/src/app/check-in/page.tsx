import type { Metadata } from 'next'
import { saveCheckIn } from '@/features/check-in/actions'
import { CheckInFlow } from '@/features/check-in/components/check-in-flow'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { formatLongDate } from '@/shared/lib/time'

export const metadata: Metadata = { title: 'Check-in' }

export default async function CheckInPage() {
  const { timezone } = await requireOnboardedProfile()
  return (
    <CheckInFlow
      today={formatLongDate(new Date(), timezone)}
      timeZone={timezone}
      save={saveCheckIn}
    />
  )
}
