import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { readNotifications } from '@/features/care/actions'
import { NotificationFeed } from '@/features/care/components/notification-feed'
import { PageTitle } from '@/shared/components/page-title'
import { fetchNotifications } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('care.notifications.meta')
  return { title: t('title') }
}

export default async function NotificationsPage() {
  const [{ timezone }, [{ items }, t]] = await guarded(
    requireOnboardedProfile(),
    Promise.all([fetchNotifications(), getTranslations('care.notifications')]),
  )

  return (
    <>
      <PageTitle title={t('title')} />
      <NotificationFeed notifications={items} timeZone={timezone} markRead={readNotifications} />
    </>
  )
}
