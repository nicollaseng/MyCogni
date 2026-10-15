import type { NotificationList } from '@mycogni/contracts'
import { unstable_rethrow } from 'next/navigation'
import { fetchNotifications } from '@/shared/lib/api/care'
import { readNotifications } from '../actions'
import { NotificationMenu } from './notification-menu'

const previewSize = 8

async function latestNotifications(): Promise<NotificationList> {
  try {
    return await fetchNotifications()
  } catch (cause) {
    unstable_rethrow(cause)
    console.error(cause)
    return { items: [], unread: 0 }
  }
}

export async function NotificationBell({ timeZone }: { timeZone: string }) {
  const { items, unread } = await latestNotifications()

  return (
    <NotificationMenu
      notifications={items.slice(0, previewSize)}
      unread={unread}
      timeZone={timeZone}
      markRead={readNotifications}
    />
  )
}
