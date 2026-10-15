import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { saveCheckIn } from '@/features/check-in/actions'
import { CheckInFlow } from '@/features/check-in/components/check-in-flow'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { formatDayTitle } from '@/shared/lib/time'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('checkIn.meta')
  return { title: t('title') }
}

export default async function CheckInPage() {
  const [{ timezone }, locale] = await Promise.all([requireOnboardedProfile(), getLocale()])
  return (
    <CheckInFlow
      today={formatDayTitle(new Date(), timezone, locale)}
      timeZone={timezone}
      save={saveCheckIn}
    />
  )
}
