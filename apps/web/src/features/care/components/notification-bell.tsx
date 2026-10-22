import type { NotificationList } from '@mycogni/contracts'
import { unstable_rethrow } from 'next/navigation'
import { fetchNotifications } from '@/shared/lib/api/care'
import { latestNotifications, readNotifications } from '../actions'
import { previewOf } from '../notification-preview'
import { NotificationMenu } from './notification-menu'

async function notificationsOrNone(): Promise<NotificationList> {
  try {
    return await fetchNotifications()
  } catch (cause) {
    unstable_rethrow(cause)
    console.error(cause)
    return { items: [], unread: 0 }
  }
}

interface NotificationBellProps {
  timeZone: string
  feed?: boolean
  align?: 'start' | 'end'
}

export async function NotificationBell({ timeZone, feed, align }: NotificationBellProps) {
  const { items, unread } = previewOf(await notificationsOrNone())

  return (
    <NotificationMenu
      notifications={items}
      unread={unread}
      timeZone={timeZone}
      markRead={readNotifications}
      latest={latestNotifications}
      feed={feed}
      align={align}
    />
  )
}
