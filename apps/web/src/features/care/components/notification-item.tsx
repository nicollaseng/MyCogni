import type { Notification } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatDay } from '../format-day'

interface NotificationItemProps {
  notification: Notification
  fresh: boolean
  timeZone: string
}

export function NotificationItem({ notification, fresh, timeZone }: NotificationItemProps) {
  const t = useTranslations('care.notifications')
  const kinds = useTranslations('common.professionalKinds')
  const locale = useLocale()
  const { invitation } = notification

  return (
    <li className="space-y-1">
      <p className="text-sm text-muted-foreground">
        {fresh && <span className="mr-2 font-medium text-emphasis">{t('new')}</span>}
        <time dateTime={notification.createdAt}>
          {formatDay(notification.createdAt, timeZone, locale)}
        </time>
      </p>
      {invitation === null ? (
        <p className="text-pretty">{t(`kinds.${notification.kind}`)}</p>
      ) : (
        <>
          <p className="text-pretty">{t('invitation', { name: invitation.professional.name })}</p>
          <p className="text-sm text-muted-foreground">
            {kinds(invitation.professional.kind)} · {t(`invitationStatus.${invitation.status}`)}
          </p>
          <Link
            href={`/invites/${invitation.id}`}
            className="inline-block pt-1 text-sm underline decoration-1 underline-offset-4"
          >
            {t('open')}
          </Link>
        </>
      )}
    </li>
  )
}
