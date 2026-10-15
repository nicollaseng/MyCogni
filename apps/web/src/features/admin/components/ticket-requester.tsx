import type { AdminSupportTicket } from '@mycogni/contracts'
import { supportTicketLabel } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { localeNames } from '@/features/locale/locale-names'
import { Surface } from '@/features/professional/components/workspace'
import { formatDateTime } from '@/features/professional/dates'

interface TicketRequesterProps {
  ticket: AdminSupportTicket
  timeZone: string
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 py-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-[15px] break-words">{children}</dd>
    </div>
  )
}

export function TicketRequester({ ticket, timeZone }: TicketRequesterProps) {
  const t = useTranslations('admin.support')
  const locale = useLocale()
  const { name, email } = ticket.requester
  const subject = encodeURIComponent(supportTicketLabel(ticket.number))

  return (
    <Surface className="px-4 py-2 sm:px-5">
      <dl>
        <Row label={t('ticket.name')}>{name ?? t('noName')}</Row>
        <Row label={t('ticket.email')}>
          {email === null ? (
            '—'
          ) : (
            <span className="flex flex-wrap items-baseline gap-x-3">
              <span className="break-all">{email}</span>
              <a
                href={`mailto:${email}?subject=${subject}`}
                className="text-sm underline decoration-1 underline-offset-4"
              >
                {t('ticket.reply')}
              </a>
            </span>
          )}
        </Row>
        <Row label={t('ticket.role')}>{t(`roles.${ticket.role}`)}</Row>
        <Row label={t('ticket.locale')}>{localeNames[ticket.locale]}</Row>
        <Row label={t('ticket.createdAt')}>
          {formatDateTime(new Date(ticket.createdAt), timeZone, locale)}
        </Row>
      </dl>
    </Surface>
  )
}
