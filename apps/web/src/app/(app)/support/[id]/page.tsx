import { supportTicketLabel } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { TicketDetail } from '@/features/support/components/ticket-detail'
import { PageTitle } from '@/shared/components/page-title'
import { fetchSupportTicket } from '@/shared/lib/api/support'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata({ params }: PageProps<'/support/[id]'>): Promise<Metadata> {
  const [{ id }, t] = await Promise.all([params, getTranslations('support.meta')])
  const ticket = await fetchSupportTicket(id)
  return {
    title: ticket === null ? t('new') : t('ticket', { ticket: supportTicketLabel(ticket.number) }),
  }
}

export default async function SupportTicketPage({ params }: PageProps<'/support/[id]'>) {
  const [{ id }, { timezone }] = await Promise.all([params, requireOnboardedProfile()])
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
      <div className="space-y-4">
        <Link
          href="/me/support"
          className="inline-block text-sm text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground"
        >
          {t('back')}
        </Link>
        <PageTitle
          kicker={t('kicker', { ticket: supportTicketLabel(ticket.number) })}
          title={ticket.customSubject ?? subjects(ticket.subject)}
        />
      </div>
      <TicketDetail ticket={ticket} timeZone={timezone} />
    </>
  )
}
