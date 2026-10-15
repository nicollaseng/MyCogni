'use client'

import { useTranslations } from 'next-intl'
import { FormMessage } from '@/features/account/components/form-message'
import { usePhotoEditing, type PhotoTransport } from '@/features/account/use-photo-editing'
import { Avatar } from '@/shared/components/avatar'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { initialsOf } from '@/shared/lib/initials'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'

interface ProfilePhotoStepProps {
  name: string
  profession: string
  photoUrl: string | null
  onSaved: () => Promise<void>
  finish: () => Promise<ActionResult<null>>
  transport?: PhotoTransport
}

const action = 'h-11 px-5 text-[15px]'

const linkButton = 'text-sm underline decoration-1 underline-offset-4 disabled:opacity-50'

export function ProfilePhotoStep({
  name,
  profession,
  photoUrl,
  onSaved,
  finish,
  transport,
}: ProfilePhotoStepProps) {
  const t = useTranslations('verification.photo')
  const account = useTranslations('account.avatar')
  const common = useTranslations('common')
  const { url, busy, feedback, editor, choose, remove } = usePhotoEditing({
    photoUrl,
    onSaved,
    transport,
  })
  const { submit: moveOn, pending: finishing, error: failed } = useSubmit(finish, () => undefined)
  const idle = busy === null && !finishing

  const picker = (
    <input
      type="file"
      accept="image/jpeg,image/png,image/webp"
      className="sr-only"
      disabled={!idle}
      onChange={choose}
    />
  )

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-5 rounded-[8px] bg-surface px-5 py-5">
        <Avatar src={url} initials={initialsOf(name)} size="xl" alt={common('photoOf', { name })} />
        <div className="min-w-0 space-y-1.5">
          <div className="min-w-0">
            <p className="truncate text-[17px] font-medium">{name}</p>
            <p className="truncate text-sm text-muted-foreground">{profession}</p>
          </div>
          {url !== null && (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <label className={cn(linkButton, 'cursor-pointer has-disabled:cursor-default')}>
                {picker}
                {busy === 'uploading' ? account('uploading') : account('change')}
              </label>
              <button type="button" className={linkButton} disabled={!idle} onClick={remove}>
                {busy === 'removing' ? account('removing') : account('remove')}
              </button>
            </div>
          )}
        </div>
      </div>
      <div aria-live="polite">
        <FormMessage
          error={failed ?? (feedback?.kind === 'error' ? feedback.text : null)}
          notice={feedback?.kind === 'notice' ? feedback.text : null}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {url === null ? (
          <>
            <label
              className={cn(
                buttonVariants({ size: 'sm' }),
                action,
                'cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-foreground',
                !idle && 'pointer-events-none opacity-50',
              )}
            >
              {picker}
              {busy === 'uploading' ? account('uploading') : t('add')}
            </label>
            <Button
              variant="outline"
              size="sm"
              className={action}
              disabled={!idle}
              onClick={moveOn}
            >
              {finishing ? t('saving') : t('skip')}
            </Button>
          </>
        ) : (
          <Button size="sm" className={action} disabled={!idle} onClick={moveOn}>
            {finishing ? t('saving') : t('continue')}
          </Button>
        )}
      </div>
      <p className="text-sm text-pretty text-muted-foreground">{t('later')}</p>
      {editor}
    </div>
  )
}
