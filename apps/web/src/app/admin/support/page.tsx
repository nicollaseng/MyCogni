import { supportTicketStatuses } from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { AdminTabs } from '@/features/admin/components/admin-tabs'
import { SupportInbox } from '@/features/admin/components/support-inbox'
import { inboxStatusOf } from '@/features/admin/support-inbox'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { fetchAdminSupportTickets } from '@/shared/lib/api/support'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.support')
  return { title: t('title') }
}

export default async function AdminSupportPage({ searchParams }: PageProps<'/admin/support'>) {
  const status = inboxStatusOf((await searchParams).status)
  const [tickets, { timezone }, t] = await Promise.all([
    fetchAdminSupportTickets(status),
    requireProfile(),
    getTranslations('admin.support'),
  ])
  if (tickets === null) {
    notFound()
  }

  return (
    <>
      <WorkspaceHeader title={t('title')} description={t('description')} />
      <AdminTabs
        label={t('tabs.label')}
        options={supportTicketStatuses}
        current={status}
        labelOf={(option) => t(`tabs.${option}`)}
        hrefOf={(option) => ({ pathname: '/admin/support', query: { status: option } })}
      />
      <SupportInbox key={status} tickets={tickets} status={status} timeZone={timezone} />
    </>
  )
}
