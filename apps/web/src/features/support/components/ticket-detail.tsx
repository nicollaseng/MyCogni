import type { SupportTicket } from '@mycogni/contracts'
import { useLocale, useTranslations } from 'next-intl'
import { formatFileSize } from '@/features/professional/documents'
import { Panel, Section } from '@/shared/components/section'
import { StatusTimeline } from './status-timeline'

interface TicketDetailProps {
  ticket: SupportTicket
  timeZone: string
}

export function TicketDetail({ ticket, timeZone }: TicketDetailProps) {
  const t = useTranslations('support.detail')
  const locale = useLocale()
  const { attachment } = ticket

  return (
    <div className="space-y-8">
      <Section title={t('timeline')}>
        <Panel className="py-5">
          <StatusTimeline ticket={ticket} timeZone={timeZone} />
        </Panel>
      </Section>
      {ticket.closingNote !== null && (
        <Section title={t('note')}>
          <Panel className="py-4">
            <p className="leading-relaxed break-words whitespace-pre-wrap">{ticket.closingNote}</p>
          </Panel>
        </Section>
      )}
      <Section title={t('message')}>
        <Panel className="space-y-3 py-4">
          <p className="leading-relaxed break-words whitespace-pre-wrap">{ticket.message}</p>
          {attachment !== null && (
            <p className="text-sm break-all text-muted-foreground">
              {t('attachment')}: <span className="text-foreground">{attachment.fileName}</span>
              {' · '}
              {formatFileSize(attachment.sizeBytes, locale)}
            </p>
          )}
        </Panel>
      </Section>
      <p className="text-sm text-pretty text-muted-foreground">{t('reply')}</p>
    </div>
  )
}
