import { supportTicketLabel } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { TicketDetail } from '@/features/support/components/ticket-detail'
import { fetchSupportTicket } from '@/shared/lib/api/support'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata({
  params,
}: PageProps<'/pro/support/[id]'>): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getTranslations('support.meta')])
  const ticket = await fetchSupportTicket(id)
  return {
    title: ticket === null ? t('new') : t('ticket', { ticket: supportTicketLabel(ticket.number) }),
  }
}

export default async function ProfessionalSupportTicketPage({
  params,
}: PageProps<'/pro/support/[id]'>) {
  const [{ id }, { timezone }] = await Promise.all([params, requireProfile()])
  const ticket = await fetchSupportTicket(id)
  if (ticket === null) {
    notFound()
  }
  const [t, subjects] = await Promise.all([
    getTranslations('support.detail'),
    getTranslations('support.subjects'),
  ])

  return (
    <>
      <WorkspaceHeader
        kicker={
          <Link
            href="/pro/settings#support"
            className="underline decoration-1 underline-offset-4 hover:text-foreground"
          >
            {t('back')}
          </Link>
        }
        title={ticket.customSubject ?? subjects(ticket.subject)}
        description={t('kicker', { ticket: supportTicketLabel(ticket.number) })}
      />
      <div className="max-w-3xl">
        <TicketDetail ticket={ticket} timeZone={timezone} />
      </div>
    </>
  )
}
