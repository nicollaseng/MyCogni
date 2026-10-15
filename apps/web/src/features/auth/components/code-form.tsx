'use client'

import { useTranslations } from 'next-intl'
import { useActionState, type ReactNode } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { initialFormState, type FormAction } from '../form-state'
import { FormFeedback } from './form-feedback'

interface CodeFormProps {
  action: FormAction
  submitLabel: string
  children?: ReactNode
}

export function CodeForm({ action, submitLabel, children }: CodeFormProps) {
  const t = useTranslations('auth.form')
  const [state, formAction, pending] = useActionState(action, initialFormState)

  return (
    <form action={formAction} noValidate className="space-y-5">
      <div className="space-y-3">
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
        {children}
      </div>
      <FormFeedback state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t('confirming') : submitLabel}
      </Button>
    </form>
  )
}
