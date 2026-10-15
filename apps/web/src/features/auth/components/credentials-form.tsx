'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { initialFormState, type FormAction } from '../form-state'
import { FormFeedback } from './form-feedback'

interface CredentialsFormProps {
  action: FormAction
  mode: 'sign-up' | 'sign-in'
}

const modes = {
  'sign-up': {
    submit: 'signUp',
    pending: 'signingUp',
    withPasswordHint: true,
    autoComplete: 'new-password',
  },
  'sign-in': {
    submit: 'signIn',
    pending: 'signingIn',
    withPasswordHint: false,
    autoComplete: 'current-password',
  },
} as const

export function CredentialsForm({ action, mode }: CredentialsFormProps) {
  const t = useTranslations('auth.form')
  const [state, formAction, pending] = useActionState(action, initialFormState)
  const [email, setEmail] = useState('')
  const text = modes[mode]

  return (
    <form action={formAction} noValidate className="space-y-5">
      <TextField
        label={t('email')}
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(event) => {
          setEmail(event.currentTarget.value)
        }}
        error={state.fieldErrors.email}
        required
      />
      <TextField
        label={t('password')}
        name="password"
        type="password"
        autoComplete={text.autoComplete}
        hint={text.withPasswordHint ? t('passwordHint') : undefined}
        error={state.fieldErrors.password}
        required
      />
      <FormFeedback state={state} />
      <Button type="submit" size="lg" disabled={pending} className="w-full">
        {pending ? t(text.pending) : t(text.submit)}
      </Button>
    </form>
  )
}
