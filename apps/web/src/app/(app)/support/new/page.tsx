import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { refreshAfterUpload } from '@/features/account/actions'
import { TicketForm } from '@/features/support/components/ticket-form'
import { PageTitle } from '@/shared/components/page-title'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('support.meta')
  return { title: t('new') }
}

export default async function NewSupportTicketPage() {
  const [profile, t] = await Promise.all([
    requireOnboardedProfile(),
    getTranslations('support.form'),
  ])

  return (
    <>
      <PageTitle title={t('title')} description={t('description')} />
      <TicketForm role="patient" email={profile.email} onSent={refreshAfterUpload} />
    </>
  )
}
