'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { initialFormState, type FormAction } from '../form-state'
import { FormFeedback } from './form-feedback'

export function EmailForm({ action, submitLabel }: { action: FormAction; submitLabel: string }) {
  const t = useTranslations('auth.form')
  const [state, formAction, pending] = useActionState(action, initialFormState)

  return (
    <form action={formAction} noValidate className="space-y-5">
      <TextField
        label={t('email')}
        name="email"
        type="email"
        autoComplete="email"
        error={state.fieldErrors.email}
        required
      />
      <FormFeedback state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t('sending') : submitLabel}
      </Button>
    </form>
  )
}
