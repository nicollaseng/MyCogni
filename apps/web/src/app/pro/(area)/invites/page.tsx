import { invitationLifetimeHours } from '@mycogni/domain'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { cancelInvite, invite, resendInvite } from '@/features/professional/actions'
import { InvitationsTable } from '@/features/professional/components/invitations-table'
import { InviteDialog } from '@/features/professional/components/invite-dialog'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { fetchSentInvitations } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('invites') }
}

export default async function ProfessionalInvitesPage({ searchParams }: PageProps<'/pro/invites'>) {
  const [[, { timezone }], [invitations, t, params]] = await guarded(
    Promise.all([requireVerifiedProfessional(), requireProfile()]),
    Promise.all([fetchSentInvitations(), getTranslations('professional.invites'), searchParams]),
  )

  return (
    <>
      <WorkspaceHeader
        title={t('title')}
        description={t('description', { hours: invitationLifetimeHours })}
        actions={
          <InviteDialog
            invite={invite}
            timeZone={timezone}
            defaultOpen={params.new !== undefined}
          />
        }
      />
      <InvitationsTable
        invitations={invitations}
        timeZone={timezone}
        resend={resendInvite}
        cancel={cancelInvite}
      />
    </>
  )
}
