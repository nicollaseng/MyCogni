'use client'

import { useTranslations } from 'next-intl'
import { useState, type SubmitEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { FormMessage } from './form-message'

interface DeleteAccountProps {
  remove: (confirmation: string) => Promise<ActionResult<null>>
}

export function DeleteAccount({ remove }: DeleteAccountProps) {
  const t = useTranslations('account.delete')
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const { submit, pending, error } = useSubmit(remove, () => undefined)
  const word = t('word')
  const confirmed = confirmation.trim().toUpperCase() === word

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit(confirmation)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
        className="py-3.5 text-left text-danger underline decoration-1 underline-offset-4"
      >
        {t('open')}
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 py-3.5">
      <p className="leading-relaxed text-pretty">{t('warning')}</p>
      <TextField
        label={t('confirm', { word })}
        autoComplete="off"
        value={confirmation}
        onChange={(event) => {
          setConfirmation(event.currentTarget.value)
        }}
      />
      <FormMessage error={error} notice={null} />
      <div className="flex gap-3">
        <Button
          type="submit"
          size="sm"
          shape="pill"
          disabled={!confirmed || pending}
          className="bg-danger text-background hover:bg-danger/90"
        >
          {pending ? t('deleting') : t('submit')}
        </Button>
        <Button
          type="button"
          size="sm"
          shape="pill"
          variant="ghost"
          onClick={() => {
            setOpen(false)
            setConfirmation('')
          }}
        >
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
