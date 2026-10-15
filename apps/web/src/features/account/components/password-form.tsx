'use client'

import { useTranslations } from 'next-intl'
import { useState, type SubmitEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { FormMessage } from './form-message'

interface PasswordFormProps {
  changePassword: (input: { current: string; next: string }) => Promise<ActionResult<string>>
}

export function PasswordForm({ changePassword }: PasswordFormProps) {
  const t = useTranslations('account.password')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const { submit, pending, error } = useSubmit(changePassword, (message) => {
    setNotice(message)
    setCurrent('')
    setNext('')
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    submit({ current, next })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TextField
        label={t('current')}
        type="password"
        autoComplete="current-password"
        value={current}
        onChange={(event) => {
          setCurrent(event.currentTarget.value)
        }}
      />
      <TextField
        label={t('next')}
        type="password"
        autoComplete="new-password"
        hint={t('hint')}
        value={next}
        onChange={(event) => {
          setNext(event.currentTarget.value)
        }}
      />
      <FormMessage error={error} notice={notice} />
      <Button
        type="submit"
        size="sm"

        disabled={pending || current === '' || next === ''}
      >
        {pending ? t('saving') : t('save')}
      </Button>
    </form>
  )
}
