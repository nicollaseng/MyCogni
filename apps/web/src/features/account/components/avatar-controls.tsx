'use client'

import { useTranslations } from 'next-intl'
import type { ChangeEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { FormMessage } from './form-message'
import { squareJpeg } from './resize-image'

interface AvatarControlsProps {
  hasPhoto: boolean
  upload: (data: FormData) => Promise<ActionResult<string>>
  remove: () => Promise<ActionResult<string>>
}

const linkButton = 'text-sm underline decoration-1 underline-offset-4 disabled:opacity-50'

export function AvatarControls({ hasPhoto, upload, remove }: AvatarControlsProps) {
  const t = useTranslations('account.avatar')
  const sending = useSubmit(upload, () => undefined)
  const removing = useSubmit(remove, () => undefined)
  const pending = sending.pending || removing.pending

  async function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (file === undefined) {
      return
    }
    const data = new FormData()
    data.set('photo', await squareJpeg(file).catch(() => file))
    sending.submit(data)
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <label className={linkButton}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              void choose(event)
            }}
          />
          {sending.pending ? t('uploading') : hasPhoto ? t('change') : t('add')}
        </label>
        {hasPhoto && (
          <button
            type="button"
            className={linkButton}
            disabled={pending}
            onClick={() => {
              removing.submit()
            }}
          >
            {t('remove')}
          </button>
        )}
      </div>
      <FormMessage error={sending.error ?? removing.error} notice={null} />
    </div>
  )
}
