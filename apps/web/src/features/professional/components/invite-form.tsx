'use client'

import type { CreatedInvitation } from '@mycogni/contracts'
import type { InvitationChannel } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useState, type SubmitEvent } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { formatDateTime } from '../dates'
import type { Invite } from '../invites'
import { InvitationLink } from './invitation-link'

const channels: readonly InvitationChannel[] = ['email', 'link']

function ChannelOption({
  channel,
  checked,
  onChoose,
}: {
  channel: InvitationChannel
  checked: boolean
  onChoose: (channel: InvitationChannel) => void
}) {
  const t = useTranslations('professional.invites.form')
  return (
    <label
      className={cn(
        'flex flex-1 cursor-pointer items-center justify-center rounded-full px-4 py-2 text-[15px] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground',
        checked ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground',
      )}
    >
      <input
        type="radio"
        name="channel"
        value={channel}
        checked={checked}
        onChange={() => {
          onChoose(channel)
        }}
        className="sr-only"
      />
      {t(channel)}
    </label>
  )
}

function CreatedNotice({ created, timeZone }: { created: CreatedInvitation; timeZone: string }) {
  const t = useTranslations('professional.invites.result')
  const locale = useLocale()
  const { invitation, emailSent } = created
  const email = invitation.recipientEmail ?? ''
  const message =
    invitation.channel === 'link'
      ? t('link')
      : emailSent
        ? t('emailSent', { email })
        : t('emailNotSent', { email })

  return (
    <div className="space-y-3 rounded-[18px] bg-background/70 px-4 py-4">
      <p
        role="status"
        className={cn(
          'leading-relaxed',
          !emailSent && invitation.channel === 'email' && 'font-medium',
        )}
      >
        {message}
      </p>
      <InvitationLink link={invitation.link} />
      <p className="text-sm text-muted-foreground">
        {t('validity', {
          date: formatDateTime(new Date(invitation.expiresAt), timeZone, locale),
        })}
      </p>
    </div>
  )
}

export function InviteForm({ invite, timeZone }: { invite: Invite; timeZone: string }) {
  const t = useTranslations('professional.invites.form')
  const [channel, setChannel] = useState<InvitationChannel>('email')
  const [email, setEmail] = useState('')
  const [created, setCreated] = useState<CreatedInvitation | null>(null)
  const { submit, pending, error } = useSubmit(invite, (value) => {
    setCreated(value)
    setEmail('')
  })
  const ready = channel === 'link' || email.trim() !== ''

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreated(null)
    submit(channel === 'email' ? { channel, recipientEmail: email.trim() } : { channel })
  }

  return (
    <div className="space-y-6">
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">{t('channel')}</legend>
          <div className="flex gap-1 rounded-full bg-sage p-1">
            {channels.map((option) => (
              <ChannelOption
                key={option}
                channel={option}
                checked={channel === option}
                onChoose={setChannel}
              />
            ))}
          </div>
        </fieldset>
        {channel === 'email' ? (
          <TextField
            label={t('recipient')}
            hint={t('recipientHint')}
            type="email"
            inputMode="email"
            autoComplete="off"
            value={email}
            onChange={(event) => {
              setEmail(event.currentTarget.value)
            }}
          />
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">{t('linkHint')}</p>
        )}
        <div>
          <ActionError error={error} />
          <Button type="submit" shape="pill" disabled={pending || !ready}>
            {pending ? t('sending') : channel === 'email' ? t('sendEmail') : t('createLink')}
          </Button>
        </div>
      </form>
      {created !== null && <CreatedNotice created={created} timeZone={timeZone} />}
    </div>
  )
}
