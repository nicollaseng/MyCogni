'use client'

import { useActionState } from 'react'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import { initialFormState, type FormAction } from '../form-state'
import { FormFeedback } from './form-feedback'

export function EmailForm({ action, submitLabel }: { action: FormAction; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, initialFormState)

  return (
    <form action={formAction} noValidate className="space-y-5">
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        error={state.fieldErrors.email}
        required
      />
      <FormFeedback state={state} />
      <Button type="submit" size="lg" shape="pill" disabled={pending} className="w-full">
        {pending ? 'Enviando…' : submitLabel}
      </Button>
    </form>
  )
}
