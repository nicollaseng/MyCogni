import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { InvitationList } from '@/features/care/components/invitation-list'
import { PageTitle } from '@/shared/components/page-title'
import { fetchReceivedInvitations } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('care.invites.meta')
  return { title: t('title') }
}

export default async function InvitesPage() {
  const { timezone } = await requireOnboardedProfile()
  const [invitations, t] = await Promise.all([
    fetchReceivedInvitations(),
    getTranslations('care.invites'),
  ])

  return (
    <>
      <PageTitle title={t('title')} description={t('description')} />
      <InvitationList invitations={invitations} timeZone={timezone} />
    </>
  )
}
