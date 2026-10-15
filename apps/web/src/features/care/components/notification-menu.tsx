'use client'

import { useRouter } from 'next/navigation'
import { NotificationPopover, type NotificationPopoverProps } from './notification-popover'

export function NotificationMenu(props: Omit<NotificationPopoverProps, 'navigate'>) {
  const router = useRouter()

  return (
    <NotificationPopover
      {...props}
      navigate={(href) => {
        router.push(href)
      }}
    />
  )
}
