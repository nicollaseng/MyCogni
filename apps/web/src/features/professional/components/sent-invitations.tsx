'use client'

import type { CreatedInvitation, SentInvitation } from '@mycogni/contracts'
import type { InvitationStatus } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { formatDateTime } from '../dates'
import { canResend, isOpen, type CancelInvite, type ResendInvite } from '../invites'
import { CopyLinkButton } from './invitation-link'

const statusStyles: Record<InvitationStatus, string> = {
  pending: 'bg-mist text-help',
  accepted: 'bg-sage text-emphasis',
  declined: 'bg-background/70 text-muted-foreground',
  canceled: 'bg-background/70 text-muted-foreground',
  expired: 'bg-background/70 text-muted-foreground',
}

interface SentInvitationsProps {
  invitations: readonly SentInvitation[]
  timeZone: string
  resend: ResendInvite
  cancel: CancelInvite
}

function Dates({ invitation, timeZone }: { invitation: SentInvitation; timeZone: string }) {
  const t = useTranslations('professional.invites.sent')
  const locale = useLocale()
  const format = (value: string) => formatDateTime(new Date(value), timeZone, locale)
  const parts = [t('created', { date: format(invitation.createdAt) })]
  if (invitation.status === 'pending') {
    parts.push(t('expires', { date: format(invitation.expiresAt) }))
  } else if (invitation.status === 'expired') {
    parts.push(t('expired', { date: format(invitation.expiresAt) }))
  } else if (invitation.respondedAt !== null && invitation.status !== 'canceled') {
    parts.push(t('responded', { date: format(invitation.respondedAt) }))
  }
  return <p className="text-sm text-muted-foreground">{parts.join(' · ')}</p>
}

export function SentInvitations({ invitations, timeZone, resend, cancel }: SentInvitationsProps) {
  const t = useTranslations('professional.invites')
  const [notice, setNotice] = useState<string | null>(null)
  const resending = useSubmit(resend, ({ invitation, emailSent }: CreatedInvitation) => {
    const email = invitation.recipientEmail ?? ''
    setNotice(
      invitation.channel === 'link'
        ? t('sent.renewed')
        : emailSent
          ? t('sent.resent', { email })
          : t('sent.resentNotSent', { email }),
    )
  })
  const canceling = useSubmit(cancel, () => {
    setNotice(t('sent.canceled'))
  })
  const pending = resending.pending || canceling.pending
  const error = resending.error ?? canceling.error

  if (invitations.length === 0) {
    return <p className="px-1 text-muted-foreground">{t('sent.empty')}</p>
  }

  return (
    <div className="space-y-3">
      {error !== null ? (
        <p role="alert" className="px-1 text-sm text-danger">
          {error}
        </p>
      ) : (
        notice !== null && (
          <p role="status" className="px-1 text-sm">
            {notice}
          </p>
        )
      )}
      <ul className="space-y-2">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="space-y-3 rounded-[18px] bg-surface px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <p className="min-w-0 truncate font-medium">
                {invitation.recipientEmail ?? t('sent.byLink')}
              </p>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-sm',
                  statusStyles[invitation.status],
                )}
              >
                {t(`statuses.${invitation.status}`)}
              </span>
            </div>
            <Dates invitation={invitation} timeZone={timeZone} />
            {canResend(invitation.status) && (
              <div className="flex flex-wrap items-center gap-2">
                {isOpen(invitation.status) && <CopyLinkButton link={invitation.link} />}
                <Button
                  variant="outline"
                  size="sm"
                  shape="pill"
                  disabled={pending}
                  onClick={() => {
                    setNotice(null)
                    resending.submit(invitation.id)
                  }}
                >
                  {invitation.channel === 'email' ? t('sent.resend') : t('sent.renew')}
                </Button>
                {isOpen(invitation.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    shape="pill"
                    disabled={pending}
                    onClick={() => {
                      setNotice(null)
                      canceling.submit(invitation.id)
                    }}
                  >
                    {t('sent.cancel')}
                  </Button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
