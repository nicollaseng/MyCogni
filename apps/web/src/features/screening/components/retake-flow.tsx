'use client'

import type { Assessment } from '@mycogni/contracts'
import { gad7, phq9 } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { formatLongDate } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import type { LatestResults } from '../latest'
import type { SubmitScreening } from '../model'
import { Questionnaire } from './questionnaire'
import { ScreeningResults } from './screening-results'
import { SupportStep } from './support-step'

type Step = 'intro' | 'phq9' | 'support' | 'gad7' | 'results'

interface RetakeFlowProps {
  previous: LatestResults
  timeZone: string
  send: SubmitScreening
}

export function RetakeFlow({ previous: initial, timeZone, send }: RetakeFlowProps) {
  const t = useTranslations('screening')
  const locale = useLocale()
  const [previous] = useState(initial)
  const [step, setStep] = useState<Step>('intro')
  const [depression, setDepression] = useState<Assessment>()
  const [anxiety, setAnxiety] = useState<Assessment>()
  const last = previous.phq9 ?? previous.gad7

  return (
    <div className="flex h-dvh flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col px-6 pt-5">
        <header className="flex h-11 shrink-0 items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('title')}</span>
          <Link href="/me">{t('retake.close')}</Link>
        </header>
        <main
          key={step}
          className="flex min-h-0 flex-1 animate-rise flex-col motion-reduce:animate-none"
        >
          {step === 'intro' && (
            <section className="flex min-h-0 flex-1 flex-col">
              <StepHeading title={t('retake.title')}>
                {last === undefined
                  ? t('retake.firstTime')
                  : t('retake.since', {
                      date: formatLongDate(new Date(last.completedAt), timeZone, locale),
                    })}
              </StepHeading>
              <p className="mt-6 text-[15px] leading-relaxed text-pretty">{t('retake.honest')}</p>
              <StepActions>
                <Button
                  size="lg"

                  onClick={() => {
                    setStep('phq9')
                  }}
                >
                  {t('retake.start')}
                </Button>
              </StepActions>
            </section>
          )}
          {step === 'phq9' && (
            <Questionnaire
              instrument={phq9}
              send={send}
              onDone={(assessment) => {
                setDepression(assessment)
                setStep(assessment.hasRiskFlag ? 'support' : 'gad7')
              }}
            />
          )}
          {step === 'support' && (
            <SupportStep
              onContinue={() => {
                setStep('gad7')
              }}
            />
          )}
          {step === 'gad7' && (
            <Questionnaire
              instrument={gad7}
              send={send}
              onDone={(assessment) => {
                setAnxiety(assessment)
                setStep('results')
              }}
            />
          )}
          {step === 'results' && depression !== undefined && anxiety !== undefined && (
            <section className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
              <StepHeading title={t('retake.resultsTitle')} />
              <div className="mt-6">
                <ScreeningResults
                  depression={depression}
                  anxiety={anxiety}
                  previous={{ depression: previous.phq9, anxiety: previous.gad7, timeZone }}
                />
              </div>
              <StepActions>
                <p className="mb-3 text-center text-sm text-balance text-muted-foreground">
                  {t('retake.disclaimer')}
                </p>
                <Link href="/me" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
                  {t('retake.back')}
                </Link>
              </StepActions>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
