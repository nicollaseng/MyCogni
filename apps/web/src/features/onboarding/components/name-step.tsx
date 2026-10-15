'use client'

import { useState, type SubmitEvent } from 'react'
import { StepActions } from '@/shared/components/step-actions'
import { Button } from '@/shared/ui/button'
import { TextField } from '@/shared/ui/text-field'
import type { OnboardingActions } from '../model'
import { useSubmit } from '@/shared/hooks/use-submit'
import { ActionError } from '@/shared/components/action-error'
import { StepHeading } from './step-heading'

interface NameStepProps {
  initialName: string
  save: OnboardingActions['saveName']
  onDone: () => void
}

export function NameStep({ initialName, save, onDone }: NameStepProps) {
  const [name, setName] = useState(initialName)
  const { submit, pending, error } = useSubmit(save, onDone)
  const displayName = name.trim()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    submit({ displayName, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <StepHeading title="Como podemos te chamar?">
        É assim que o app vai falar com você. Aparece só para você.
      </StepHeading>
      <div className="mt-8">
        <TextField
          label="Nome"
          name="displayName"
          autoComplete="given-name"
          maxLength={80}
          value={name}
          onChange={(event) => {
            setName(event.currentTarget.value)
          }}
        />
      </div>
      <StepActions>
        <ActionError error={error} />
        <Button type="submit" size="lg" shape="pill" disabled={displayName === '' || pending}>
          {pending ? 'Salvando…' : 'Continuar'}
        </Button>
      </StepActions>
    </form>
  )
}
