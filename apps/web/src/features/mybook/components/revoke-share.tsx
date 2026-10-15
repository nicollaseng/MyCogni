'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'

interface RevokeShareProps {
  id: string
  name: string
  revoke: (id: string) => Promise<ActionResult<null>>
}

export function RevokeShare({ id, name, revoke }: RevokeShareProps) {
  const t = useTranslations('mybook.sharing.shares')
  const [open, setOpen] = useState(false)
  const { submit, pending, error } = useSubmit(revoke, () => {
    setOpen(false)
  })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
        className="text-sm text-danger underline decoration-1 underline-offset-4"
      >
        {t('revoke')}
      </button>
    )
  }

  return (
    <div className="space-y-3 pt-1">
      <p className="leading-relaxed text-pretty">{t('revokeWarning', { name })}</p>
      <ActionError error={error} />
      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          shape="pill"
          disabled={pending}
          className="bg-danger text-background hover:bg-danger/90"
          onClick={() => {
            submit(id)
          }}
        >
          {pending ? t('revoking') : t('revokeConfirm')}
        </Button>
        <Button
          size="sm"
          shape="pill"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setOpen(false)
          }}
        >
          {t('cancel')}
        </Button>
      </div>
    </div>
  )
}
