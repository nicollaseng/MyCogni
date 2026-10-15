import { supportTicketLabel } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { changeTicketStatus } from '@/features/admin/actions'
import { SupportActions } from '@/features/admin/components/support-actions'
import { TicketRequester } from '@/features/admin/components/ticket-requester'
import {
  Surface,
  WorkspaceHeader,
  WorkspaceSection,
} from '@/features/professional/components/workspace'
import { formatFileSize } from '@/features/professional/documents'
import { StatusTimeline } from '@/features/support/components/status-timeline'
import { fetchAdminSupportTicket } from '@/shared/lib/api/support'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata({
  params,
}: PageProps<'/admin/support/[id]'>): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getTranslations('admin.support')])
  const ticket = await fetchAdminSupportTicket(id)
  return { title: ticket === null ? t('title') : supportTicketLabel(ticket.number) }
}

export default async function AdminSupportTicketPage({ params }: PageProps<'/admin/support/[id]'>) {
  const [{ id }, { timezone }] = await Promise.all([params, requireProfile()])
  const ticket = await fetchAdminSupportTicket(id)
  if (ticket === null) {
    notFound()
  }
  const [t, subjects, locale] = await Promise.all([
    getTranslations('admin.support'),
    getTranslations('support.subjects'),
    getLocale(),
  ])
  const label = supportTicketLabel(ticket.number)
  const { attachment } = ticket

  return (
    <>
      <WorkspaceHeader
        kicker={
          <Link
            href={{ pathname: '/admin/support', query: { status: ticket.status } }}
            className="underline decoration-1 underline-offset-4 hover:text-foreground"
          >
            {t('ticket.back')}
          </Link>
        }
        title={ticket.customSubject ?? subjects(ticket.subject)}
        description={
          ticket.customSubject === null ? label : `${label} · ${subjects(ticket.subject)}`
        }
      />
      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-7">
          <WorkspaceSection title={t('ticket.message')}>
            <Surface className="space-y-4 px-4 py-4 sm:px-5">
              <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                {ticket.message}
              </p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                <span className="text-muted-foreground">{t('ticket.attachment')}</span>
                {attachment === null ? (
                  <span className="text-muted-foreground">{t('ticket.noAttachment')}</span>
                ) : (
                  <>
                    <span className="min-w-0 break-all">
                      {attachment.fileName}
                      <span className="text-muted-foreground">
                        {' · '}
                        {formatFileSize(attachment.sizeBytes, locale)}
                      </span>
                    </span>
                    <a
                      href={`/admin/support/${ticket.id}/attachment`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('ticket.openLabel', { name: attachment.fileName })}
                      className="font-medium underline decoration-1 underline-offset-4"
                    >
                      {t('ticket.open')}
                    </a>
                  </>
                )}
              </div>
            </Surface>
          </WorkspaceSection>
          {ticket.closingNote !== null && (
            <WorkspaceSection title={t('ticket.note')}>
              <Surface className="px-4 py-4 sm:px-5">
                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
                  {ticket.closingNote}
                </p>
              </Surface>
            </WorkspaceSection>
          )}
          <WorkspaceSection title={t('ticket.requester')}>
            <TicketRequester ticket={ticket} timeZone={timezone} />
          </WorkspaceSection>
        </div>
        <div className="space-y-7">
          <WorkspaceSection title={t('actions.title')}>
            <Surface className="px-4 py-4 sm:px-5">
              <SupportActions
                ticket={{ id: ticket.id, number: ticket.number, status: ticket.status }}
                change={changeTicketStatus}
              />
            </Surface>
          </WorkspaceSection>
          <WorkspaceSection title={t('ticket.timeline')}>
            <Surface className="px-4 py-5 sm:px-5">
              <StatusTimeline ticket={ticket} timeZone={timezone} />
            </Surface>
          </WorkspaceSection>
        </div>
      </div>
    </>
  )
}
