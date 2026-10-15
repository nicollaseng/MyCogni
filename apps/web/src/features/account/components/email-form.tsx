'use client'

import { useTranslations } from 'next-intl'
import { useState, type SubmitEvent } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { FormMessage } from './form-message'

interface EmailFormProps {
  changeEmail: (email: string) => Promise<ActionResult<string>>
}

export function EmailForm({ changeEmail }: EmailFormProps) {
  const t = useTranslations('account.email')
  const [email, setEmail] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const { submit, pending, error } = useSubmit(changeEmail, setNotice)

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    submit(email)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <TextField
        label={t('field')}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.currentTarget.value)
        }}
      />
      <FormMessage error={error} notice={notice} />
      <Button type="submit" size="sm" shape="pill" disabled={pending || email.trim() === ''}>
        {pending ? t('sending') : t('send')}
      </Button>
    </form>
  )
}
