'use client'

import { useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { initialFormState, type FormAction } from '../form-state'
import { FormFeedback } from './form-feedback'

interface CodeFormProps {
  action: FormAction
  withNewPassword?: boolean
  submitLabel: string
}

export function CodeForm({ action, withNewPassword = false, submitLabel }: CodeFormProps) {
  const t = useTranslations('auth.form')
  const [state, formAction, pending] = useActionState(action, initialFormState)

  return (
    <form action={formAction} noValidate className="space-y-5">
      <TextField
        label={t('code')}
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        placeholder="000000"
        error={state.fieldErrors.code}
        className="h-14 text-center font-serif text-[28px] tracking-[0.4em]"
        required
      />
      {withNewPassword && (
        <TextField
          label={t('newPassword')}
          name="password"
          type="password"
          autoComplete="new-password"
          hint={t('passwordHint')}
          error={state.fieldErrors.password}
          required
        />
      )}
      <FormFeedback state={state} />
      <Button type="submit" size="lg" shape="pill" disabled={pending} className="w-full">
        {pending ? t('confirming') : submitLabel}
      </Button>
    </form>
  )
}
