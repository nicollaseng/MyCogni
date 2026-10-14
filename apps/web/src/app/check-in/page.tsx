import type { Metadata } from 'next'
import { CheckInFlow } from '@/features/check-in/components/check-in-flow'
import { requireOnboardedUser } from '@/shared/lib/auth/session'
import { defaultTimeZone, formatLongDate } from '@/shared/lib/time'

export const metadata: Metadata = { title: 'Check-in' }

export default async function CheckInPage() {
  await requireOnboardedUser()
  return <CheckInFlow today={formatLongDate(new Date(), defaultTimeZone)} />
}
