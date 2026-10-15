'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { initialFormState, type FormAction } from '../form-state'
import { FormFeedback } from './form-feedback'

interface NewPasswordFormProps {
  action: FormAction
  submitLabel: string
}

export function NewPasswordForm({ action, submitLabel }: NewPasswordFormProps) {
  const t = useTranslations('auth.form')
  const [state, formAction, pending] = useActionState(action, initialFormState)

  return (
    <form action={formAction} noValidate className="space-y-5">
      <TextField
        label={t('newPassword')}
        name="password"
        type="password"
        autoComplete="new-password"
        hint={t('passwordHint')}
        error={state.fieldErrors.password}
        required
      />
      <FormFeedback state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t('saving') : submitLabel}
      </Button>
    </form>
  )
}
