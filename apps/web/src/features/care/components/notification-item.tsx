import type { Notification } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatDay } from '../format-day'
import { notificationHref } from '../notification-href'

export function NotificationMessage({ notification }: { notification: Notification }) {
  const t = useTranslations('care.notifications')
  const { invitation, kind } = notification

  return invitation === null
    ? t(`kinds.${kind}`)
    : t('invitation', { name: invitation.professional.name })
}

interface NotificationItemProps {
  notification: Notification
  fresh: boolean
  timeZone: string
}

export function NotificationItem({ notification, fresh, timeZone }: NotificationItemProps) {
  const t = useTranslations('care.notifications')
  const kinds = useTranslations('common.professionalKinds')
  const locale = useLocale()
  const { invitation, kind } = notification
  const href = notificationHref(notification)

  return (
    <li className="space-y-1">
      <p className="text-sm text-muted-foreground">
        {fresh && <span className="mr-2 font-medium text-emphasis">{t('new')}</span>}
        <time dateTime={notification.createdAt}>
          {formatDay(notification.createdAt, timeZone, locale)}
        </time>
      </p>
      <p className="text-pretty">
        <NotificationMessage notification={notification} />
      </p>
      {invitation !== null && (
        <p className="text-sm text-muted-foreground">
          {kinds(invitation.professional.kind)} · {t(`invitationStatus.${invitation.status}`)}
        </p>
      )}
      {kind !== 'system' && kind !== 'marketing' && href !== '/notifications' && (
        <Link
          href={href}
          className="inline-block pt-1 text-sm underline decoration-1 underline-offset-4"
        >
          {t(`open.${kind}`)}
        </Link>
      )}
    </li>
  )
}
