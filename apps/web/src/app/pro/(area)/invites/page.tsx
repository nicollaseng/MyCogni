import { invitationLifetimeHours } from '@mycogni/domain'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { cancelInvite, invite, resendInvite } from '@/features/professional/actions'
import { InviteForm } from '@/features/professional/components/invite-form'
import { SentInvitations } from '@/features/professional/components/sent-invitations'
import { PageTitle } from '@/shared/components/page-title'
import { Panel, Section } from '@/shared/components/section'
import { fetchSentInvitations } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('invites') }
}

export default async function ProfessionalInvitesPage() {
  await requireVerifiedProfessional()
  const [{ timezone }, invitations, t] = await Promise.all([
    requireProfile(),
    fetchSentInvitations(),
    getTranslations('professional.invites'),
  ])

  return (
    <>
      <PageTitle
        title={t('title')}
        description={t('description', { hours: invitationLifetimeHours })}
      />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <Section title={t('form.title')}>
          <Panel className="py-5">
            <InviteForm invite={invite} timeZone={timezone} />
          </Panel>
        </Section>
        <Section title={t('sent.title')}>
          <SentInvitations
            invitations={invitations}
            timeZone={timezone}
            resend={resendInvite}
            cancel={cancelInvite}
          />
        </Section>
      </div>
    </>
  )
}
