'use client'

import type { Assessment } from '@mycogni/contracts'
import { ScreeningResults } from '@/features/screening/components/screening-results'
import { ActionError } from '@/shared/components/action-error'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { useSubmit } from '@/shared/hooks/use-submit'
import { Button } from '@/shared/ui/button'
import type { OnboardingActions } from '../model'

interface ResultsStepProps {
  depression: Assessment
  anxiety: Assessment
  finish: OnboardingActions['finishOnboarding']
}

export function ResultsStep({ depression, anxiety, finish }: ResultsStepProps) {
  const { submit, pending, error } = useSubmit(finish, () => undefined)

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
      <StepHeading title="Seu ponto de partida.">A referência para ver como você muda.</StepHeading>
      <div className="mt-6">
        <ScreeningResults depression={depression} anxiety={anxiety} />
      </div>
      <StepActions>
        <p className="mb-3 text-center text-sm text-balance text-muted-foreground">
          É uma triagem, não um diagnóstico. Só um profissional pode avaliar o seu caso.
        </p>
        <ActionError error={error} />
        <Button
          size="lg"
          shape="pill"
          disabled={pending}
          onClick={() => {
            submit()
          }}
        >
          {pending ? 'Preparando…' : 'Começar a usar'}
        </Button>
      </StepActions>
    </section>
  )
}
