import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { refreshAfterUpload } from '@/features/account/actions'
import { Surface, WorkspaceHeader } from '@/features/professional/components/workspace'
import { TicketForm } from '@/features/support/components/ticket-form'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('support.meta')
  return { title: t('new') }
}

export default async function ProfessionalNewSupportTicketPage() {
  const [profile, t] = await Promise.all([requireProfile(), getTranslations('support.form')])

  return (
    <>
      <WorkspaceHeader title={t('title')} description={t('description')} />
      <Surface className="max-w-3xl px-4 py-6 sm:px-6">
        <TicketForm role="professional" email={profile.email} onSent={refreshAfterUpload} />
      </Surface>
    </>
  )
}
