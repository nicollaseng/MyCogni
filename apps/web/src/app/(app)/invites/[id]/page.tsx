import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { acceptInvite, declineInvite } from '@/features/care/actions'
import { AcceptanceForm } from '@/features/care/components/acceptance-form'
import { InvitationOutcome } from '@/features/care/components/invitation-outcome'
import { SharingSummary } from '@/features/care/components/sharing-summary'
import { SharingTerms } from '@/features/care/components/sharing-terms'
import { statusDate } from '@/features/care/invitations'
import { PageTitle } from '@/shared/components/page-title'
import { fetchReceivedInvitation } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('care.accept.meta')
  return { title: t('title') }
}

export default async function InvitationPage({ params }: PageProps<'/invites/[id]'>) {
  const [{ id }, { timezone }] = await Promise.all([params, requireOnboardedProfile()])
  const invitation = await fetchReceivedInvitation(id)
  if (invitation === null) {
    notFound()
  }
  const [t, kinds] = await Promise.all([
    getTranslations('care.accept'),
    getTranslations('common.professionalKinds'),
  ])
  const { professional } = invitation
  const profession = kinds(professional.kind)

  return (
    <>
      <PageTitle
        kicker={t('kicker')}
        title={
          invitation.status === 'pending'
            ? t('title', { name: professional.name })
            : professional.name
        }
        description={
          professional.registration === null
            ? profession
            : `${profession} · ${t('registration', { registration: professional.registration })}`
        }
      />
      {invitation.status === 'pending' ? (
        <>
          <SharingSummary name={professional.name} />
          <AcceptanceForm
            professionalName={professional.name}
            accept={acceptInvite.bind(null, invitation.id)}
            decline={declineInvite.bind(null, invitation.id)}
          >
            <SharingTerms name={professional.name} />
          </AcceptanceForm>
        </>
      ) : (
        <InvitationOutcome
          status={invitation.status}
          name={professional.name}
          date={statusDate(invitation)}
          timeZone={timezone}
        />
      )}
    </>
  )
}
