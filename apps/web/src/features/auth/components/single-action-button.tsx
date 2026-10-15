'use client'

import { useActionState, type ReactNode } from 'react'
import { Button } from '@/shared/ui/button'
import { initialFormState, type FormState } from '../form-state'
import { FormFeedback } from './form-feedback'

interface SingleActionButtonProps {
  action: (state: FormState) => Promise<FormState>
  children: ReactNode
  pendingLabel: string
  variant?: 'outline' | 'ghost'
}

export function SingleActionButton({
  action,
  children,
  pendingLabel,
  variant = 'outline',
}: SingleActionButtonProps) {
  const [state, formAction, pending] = useActionState(action, initialFormState)

  return (
    <form action={formAction} className="space-y-3">
      <Button
        type="submit"
        variant={variant}
        size="lg"
        shape="pill"
        disabled={pending}
        className="w-full"
      >
        {pending ? pendingLabel : children}
      </Button>
      <FormFeedback state={state} />
    </form>
  )
}
