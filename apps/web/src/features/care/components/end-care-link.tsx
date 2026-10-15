'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { ActionError } from '@/shared/components/action-error'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'

interface EndCareLinkProps {
  id: string
  name: string
  end: (id: string) => Promise<ActionResult<null>>
}

export function EndCareLinkConfirmation({
  id,
  name,
  end,
  onClose,
}: EndCareLinkProps & { onClose: () => void }) {
  const t = useTranslations('care.links.end')
  const { submit, pending, error } = useSubmit(end, onClose)

  return (
    <div className="space-y-3 pt-1">
      <p className="leading-relaxed text-pretty">{t('warning', { name })}</p>
      <ActionError error={error} />
      <div className="flex gap-3">
        <Button
          size="sm"
          disabled={pending}
          className="bg-danger text-background hover:bg-danger/90"
          onClick={() => {
            submit(id)
          }}
        >
          {pending ? t('ending') : t('confirm')}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={onClose}>
          {t('cancel')}
        </Button>
      </div>
    </div>
  )
}

export function EndCareLink({ id, name, end }: EndCareLinkProps) {
  const t = useTranslations('care.links.end')
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
        className="text-sm text-danger underline decoration-1 underline-offset-4"
      >
        {t('open')}
      </button>
    )
  }

  return (
    <EndCareLinkConfirmation
      id={id}
      name={name}
      end={end}
      onClose={() => {
        setOpen(false)
      }}
    />
  )
}
