'use client'

import { useActionState, useState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { initialFormState, type FormAction } from '../form-state'
import { FormFeedback } from './form-feedback'

interface CredentialsFormProps {
  action: FormAction
  mode: 'sign-up' | 'sign-in'
}

const copy = {
  'sign-up': {
    submit: 'Criar conta',
    pending: 'Criando conta…',
    passwordHint: 'Pelo menos 8 caracteres, com letras e números.',
    autoComplete: 'new-password',
  },
  'sign-in': {
    submit: 'Entrar',
    pending: 'Entrando…',
    passwordHint: undefined,
    autoComplete: 'current-password',
  },
} as const

export function CredentialsForm({ action, mode }: CredentialsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState)
  const [email, setEmail] = useState('')
  const text = copy[mode]

  return (
    <form action={formAction} noValidate className="space-y-5">
      <TextField
        label="Email"
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
        label="Senha"
        name="password"
        type="password"
        autoComplete={text.autoComplete}
        hint={text.passwordHint}
        error={state.fieldErrors.password}
        required
      />
      <FormFeedback state={state} />
      <Button type="submit" size="lg" shape="pill" disabled={pending} className="w-full">
        {pending ? text.pending : text.submit}
      </Button>
    </form>
  )
}
