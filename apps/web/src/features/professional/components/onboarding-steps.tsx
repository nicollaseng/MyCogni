import { registrationProofOf, type ProfessionalKind } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { cn } from '@/shared/lib/utils'
import { onboardingSteps, stepNumberOf, type OnboardingStep } from '../onboarding'
import { CheckIcon } from './icons'

type StepState = 'done' | 'current' | 'upcoming'

const rules: Readonly<Record<StepState, string>> = {
  done: 'border-foreground/35',
  current: 'border-foreground',
  upcoming: 'border-rule',
}

const labels: Readonly<Record<StepState, string>> = {
  done: 'text-foreground',
  current: 'font-medium text-foreground',
  upcoming: 'text-muted-foreground',
}

function stateOf(number: number, current: number): StepState {
  if (number < current) {
    return 'done'
  }
  return number === current ? 'current' : 'upcoming'
}

interface OnboardingStepsProps {
  current: OnboardingStep
  kind: ProfessionalKind
}

export function OnboardingSteps({ current, kind }: OnboardingStepsProps) {
  const t = useTranslations('verification')
  const titleId = useId()
  const position = stepNumberOf(current)
  const hints: Readonly<Record<OnboardingStep, string>> = {
    document: t(`proofs.${registrationProofOf(kind)}.title`),
    photo: t('steps.hints.photo'),
    review: t('steps.hints.review'),
  }

  return (
    <div>
      <p id={titleId} className="mb-3 hidden text-sm text-muted-foreground lg:block">
        {t('steps.title')}
      </p>
      <ol aria-labelledby={titleId} className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0">
        {onboardingSteps.map((step, index) => {
          const number = index + 1
          const state = stateOf(number, position)
          return (
            <li
              key={step}
              aria-current={state === 'current' ? 'step' : undefined}
              className={cn(
                'border-t-2 pt-2 lg:border-t-0 lg:border-l-2 lg:py-3 lg:pl-4',
                rules[state],
              )}
            >
              <p
                className={cn(
                  'flex items-center gap-2 text-[13px] leading-snug lg:text-[15px]',
                  labels[state],
                )}
              >
                <span
                  aria-hidden
                  className="hidden w-4 shrink-0 text-muted-foreground tabular-nums lg:inline-flex"
                >
                  {state === 'done' ? <CheckIcon className="size-4" /> : number}
                </span>
                <span>
                  {t(`steps.names.${step}`)}
                  {state === 'done' && <span className="sr-only">, {t('steps.done')}</span>}
                </span>
              </p>
              <p className="mt-1 hidden pl-6 text-sm leading-snug text-pretty text-muted-foreground lg:block">
                {hints[step]}
              </p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
