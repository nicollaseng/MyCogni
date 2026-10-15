import { isInvitationCode, normalizeInvitationCode } from '@mycogni/domain'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { claimInvite } from '@/features/care/actions'
import { ClaimInvite } from '@/features/care/components/claim-invite'
import {
  ClosedInvite,
  InviteFrame,
  PendingInvite,
  SignedOutChoices,
  UnknownInvite,
} from '@/features/care/components/invite-landing'
import { fetchInvitationPreview } from '@/shared/lib/api/care'
import { currentUser } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('care.invite.meta')
  return { title: t('title') }
}

export default async function InvitePage({ params }: PageProps<'/invite/[code]'>) {
  const { code: requested } = await params
  const code = normalizeInvitationCode(requested)
  const valid = isInvitationCode(code)
  if (valid && code !== requested) {
    redirect(`/invite/${code}`)
  }
  const [preview, user] = await Promise.all([
    valid ? fetchInvitationPreview(code) : null,
    currentUser(),
  ])
  const signedIn = user !== null

  return (
    <InviteFrame>
      {preview === null ? (
        <UnknownInvite signedIn={signedIn} />
      ) : preview.status === 'pending' ? (
        <PendingInvite preview={preview} now={new Date()}>
          {signedIn ? (
            <ClaimInvite claim={claimInvite.bind(null, code)} />
          ) : (
            <SignedOutChoices code={code} />
          )}
        </PendingInvite>
      ) : (
        <ClosedInvite
          status={preview.status}
          name={preview.professional.name}
          signedIn={signedIn}
        />
      )}
    </InviteFrame>
  )
}
