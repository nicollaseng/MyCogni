'use client'

import type { Notification } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { Panel } from '@/shared/components/section'
import type { ActionResult } from '@/shared/lib/actions/result'
import { NotificationItem } from './notification-item'

interface NotificationFeedProps {
  notifications: readonly Notification[]
  timeZone: string
  markRead: (ids: string[]) => Promise<ActionResult<null>>
}

export function NotificationFeed({ notifications, timeZone, markRead }: NotificationFeedProps) {
  const t = useTranslations('care.notifications')
  const [fresh] = useState(() =>
    notifications.filter((notification) => notification.readAt === null).map(({ id }) => id),
  )
  const marked = useRef(false)

  useEffect(() => {
    if (marked.current || fresh.length === 0) {
      return
    }
    marked.current = true
    void markRead(fresh)
  }, [fresh, markRead])

  if (notifications.length === 0) {
    return (
      <Panel>
        <p className="py-3.5 text-muted-foreground">{t('empty')}</p>
      </Panel>
    )
  }

  return (
    <Panel>
      <ul>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            fresh={fresh.includes(notification.id)}
            timeZone={timeZone}
          />
        ))}
      </ul>
    </Panel>
  )
}
