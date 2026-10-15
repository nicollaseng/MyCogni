import { unstable_rethrow } from 'next/navigation'
import { fetchNotifications } from '@/shared/lib/api/care'
import { BellLink } from './bell-link'

async function unreadCount(): Promise<number> {
  try {
    return (await fetchNotifications()).unread
  } catch (cause) {
    unstable_rethrow(cause)
    console.error(cause)
    return 0
  }
}

export async function NotificationBell() {
  return <BellLink unread={await unreadCount()} />
}
