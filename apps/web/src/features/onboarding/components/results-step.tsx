'use client'

import type { Assessment } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
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
  const t = useTranslations('onboarding.results')
  const { submit, pending, error } = useSubmit(finish, () => undefined)

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
      <StepHeading title={t('title')}>{t('lead')}</StepHeading>
      <div className="mt-6">
        <ScreeningResults depression={depression} anxiety={anxiety} />
      </div>
      <StepActions>
        <p className="mb-3 text-center text-sm text-balance text-muted-foreground">
          {t('disclaimer')}
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
          {pending ? t('finishing') : t('finish')}
        </Button>
      </StepActions>
    </section>
  )
}
