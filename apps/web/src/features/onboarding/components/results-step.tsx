'use client'

import type { Assessment } from '@mycogni/contracts'
import { instruments } from '@mycogni/domain'
import { StepActions } from '@/shared/components/step-actions'
import { Button } from '@/shared/ui/button'
import { instrumentTopics, severityGuidance, severityLabels } from '@/features/screening/copy'
import type { OnboardingActions } from '../model'
import { useSubmit } from '@/shared/hooks/use-submit'
import { ActionError } from '@/shared/components/action-error'
import { ScoreScale } from './score-scale'
import { StepHeading } from './step-heading'

function Result({ assessment }: { assessment: Assessment }) {
  const instrument = instruments[assessment.instrument]
  return (
    <section
      aria-label={instrumentTopics[assessment.instrument]}
      className="border-b border-rule py-4"
    >
      <h2 className="text-sm">
        {instrumentTopics[assessment.instrument]}
        <span className="whitespace-nowrap text-muted-foreground"> · {instrument.name}</span>
      </h2>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="font-serif text-[34px] leading-none tracking-[-0.02em]">
          {assessment.totalScore}
        </span>
        <span className="text-sm text-muted-foreground">de {assessment.maxScore}</span>
        <span className="ml-auto text-right text-sm font-medium">
          {severityLabels[assessment.severity]}
        </span>
      </p>
      <ScoreScale instrument={instrument} score={assessment.totalScore} />
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
        {severityGuidance[assessment.severity]}
      </p>
    </section>
  )
}

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
      <div className="mt-6 border-t border-rule">
        <Result assessment={depression} />
        <Result assessment={anxiety} />
      </div>
      {depression.hasRiskFlag && (
        <p className="mt-5 border-l-2 border-help pl-4 text-sm leading-relaxed">
          Se pensar em se ferir de novo, ligue{' '}
          <a href="tel:188" className="font-medium underline decoration-1 underline-offset-4">
            188
          </a>{' '}
          (CVV, 24 horas) ou{' '}
          <a href="tel:192" className="font-medium underline decoration-1 underline-offset-4">
            192
          </a>{' '}
          em emergência.
        </p>
      )}
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
