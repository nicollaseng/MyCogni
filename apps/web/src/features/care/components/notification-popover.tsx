'use client'

import type { Notification } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition, type MouseEvent } from 'react'
import { usePopoverMenu } from '@/shared/hooks/use-popover-menu'
import type { ActionResult } from '@/shared/lib/actions/result'
import { formatRelativeTime } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { headerDropdownStyle, menuItemStyle } from '@/shared/ui/menu'
import { notificationHref, type NotificationHref } from '../notification-href'
import { BellGlyph, bellStyle } from './bell-link'
import { NotificationMessage } from './notification-item'

export interface NotificationPopoverProps {
  notifications: readonly Notification[]
  unread: number
  timeZone: string
  markRead: (ids: string[]) => Promise<ActionResult<null>>
  navigate: (href: NotificationHref) => void
}

interface NotificationRowsProps {
  notifications: readonly Notification[]
  timeZone: string
  isUnread: (notification: Notification) => boolean
  onOpen: (event: MouseEvent<HTMLAnchorElement>, notification: Notification) => void
  onSeeAll: () => void
}

function NotificationRows({
  notifications,
  timeZone,
  isUnread,
  onOpen,
  onSeeAll,
}: NotificationRowsProps) {
  const t = useTranslations('care.bell')
  const feed = useTranslations('care.notifications')
  const locale = useLocale()
  const [now] = useState(() => new Date())

  if (notifications.length === 0) {
    return <p className="px-4 pt-1 pb-5 text-[15px] text-muted-foreground">{feed('empty')}</p>
  }

  return (
    <div role="menu" aria-label={feed('title')} className="flex min-h-0 flex-col">
      <div className="min-h-0 overflow-y-auto px-1 pb-1">
        {notifications.map((notification) => {
          const unread = isUnread(notification)
          return (
            <Link
              key={notification.id}
              href={notificationHref(notification)}
              role="menuitem"
              tabIndex={-1}
              onClick={(event) => {
                onOpen(event, notification)
              }}
              className={cn(menuItemStyle, 'items-start gap-3 py-2.5')}
            >
              <span
                aria-hidden
                className={cn(
                  'mt-2 size-1.5 shrink-0 rounded-full',
                  unread ? 'bg-emphasis' : 'bg-transparent',
                )}
              />
              <span className="min-w-0 flex-1 space-y-0.5">
                {unread && <span className="sr-only">{feed('new')}: </span>}
                <span
                  className={cn(
                    'block leading-snug text-pretty',
                    !unread && 'text-muted-foreground',
                  )}
                >
                  <NotificationMessage notification={notification} />
                </span>
                <time
                  dateTime={notification.createdAt}
                  className="block text-[13px] text-muted-foreground"
                >
                  {formatRelativeTime(new Date(notification.createdAt), now, timeZone, locale)}
                </time>
              </span>
            </Link>
          )
        })}
      </div>
      <div className="border-t border-rule p-1">
        <Link
          href="/notifications"
          role="menuitem"
          tabIndex={-1}
          onClick={onSeeAll}
          className={menuItemStyle}
        >
          {t('seeAll')}
        </Link>
      </div>
    </div>
  )
}

export function NotificationPopover({
  notifications,
  unread,
  timeZone,
  markRead,
  navigate,
}: NotificationPopoverProps) {
  const t = useTranslations('care.bell')
  const feed = useTranslations('care.notifications')
  const [readHere, setReadHere] = useState<readonly string[]>([])
  const [, startTransition] = useTransition()
  const { open, mounted, closing, close, triggerProps, panelProps } = usePopoverMenu()
  const readHereStillUnread = notifications.filter(
    (notification) => notification.readAt === null && readHere.includes(notification.id),
  ).length
  const count = Math.max(0, unread - readHereStillUnread)

  function isUnread(notification: Notification): boolean {
    return notification.readAt === null && !readHere.includes(notification.id)
  }

  function openNotification(event: MouseEvent<HTMLAnchorElement>, notification: Notification) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    close(false)
    const href = notificationHref(notification)
    if (!isUnread(notification)) {
      navigate(href)
      return
    }
    setReadHere((ids) => [...ids, notification.id])
    startTransition(async () => {
      await markRead([notification.id])
      navigate(href)
    })
  }

  return (
    <div className="-my-2">
      <button
        {...triggerProps}
        aria-label={t('label', { count })}
        className={cn(bellStyle, open && 'text-foreground')}
      >
        <BellGlyph unread={count} />
      </button>
      {mounted && (
        <div
          {...panelProps}
          className={headerDropdownStyle(
            closing,
            'flex max-h-[calc(100dvh-6rem)] flex-col sm:w-[22rem]',
          )}
        >
          <div className="flex items-baseline justify-between gap-4 px-4 pt-3.5 pb-2">
            <p className="text-[15px] font-medium">{feed('title')}</p>
            {count > 0 && (
              <p className="text-[13px] text-muted-foreground">{t('unread', { count })}</p>
            )}
          </div>
          <NotificationRows
            notifications={notifications}
            timeZone={timeZone}
            isUnread={isUnread}
            onOpen={openNotification}
            onSeeAll={() => {
              close(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
