'use client'

import type { Assessment } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useSyncExternalStore } from 'react'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import { formatLongDate } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { Button, buttonVariants } from '@/shared/ui/button'
import { hasScreeningDraft } from '../draft'
import { latestByDomain } from '../latest'
import type { ScreeningResults as Results, SubmitScreening } from '../model'
import { resultsBefore } from '../session'
import { ScreeningFlow } from './screening-flow'
import { ScreeningResults } from './screening-results'

type Step = 'intro' | 'questions' | 'results'

interface RetakeFlowProps {
  userId: string
  assessments: readonly Assessment[]
  timeZone: string
  send: SubmitScreening
}

function subscribeToNothing(): () => void {
  return () => undefined
}

export function RetakeFlow({ userId, assessments, timeZone, send }: RetakeFlowProps) {
  const t = useTranslations('screening')
  const locale = useLocale()
  const resumable = useSyncExternalStore(
    subscribeToNothing,
    () => hasScreeningDraft(userId),
    () => false,
  )
  const [chosen, setChosen] = useState<Step | null>(null)
  const [results, setResults] = useState<Results | null>(null)
  const step = chosen ?? (resumable ? 'questions' : 'intro')
  const latest = latestByDomain(assessments)
  const last = latest.depression ?? latest.anxiety

  return (
    <div className="flex h-dvh flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col px-6 pt-5">
        <header className="flex h-11 shrink-0 items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('title')}</span>
          <Link href="/me/wellbeing">{t('retake.close')}</Link>
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
                    setChosen('questions')
                  }}
                >
                  {t('retake.start')}
                </Button>
              </StepActions>
            </section>
          )}
          {step === 'questions' && (
            <ScreeningFlow
              userId={userId}
              scope="retake"
              assessments={assessments}
              send={send}
              onComplete={(done) => {
                setResults(done)
                setChosen('results')
              }}
            />
          )}
          {step === 'results' && results !== null && (
            <section className="flex min-h-0 flex-1 flex-col overflow-y-auto [scrollbar-width:none]">
              <StepHeading title={t('retake.resultsTitle')} />
              <div className="mt-6">
                <ScreeningResults
                  depression={results.depression}
                  anxiety={results.anxiety}
                  previous={resultsBefore(assessments, results)}
                />
              </div>
              <StepActions>
                <p className="mb-3 text-center text-sm text-balance text-muted-foreground">
                  {t('retake.disclaimer')}
                </p>
                <Link href="/me/wellbeing" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
                  {t('retake.back')}
                </Link>
                <Link
                  href="/zen"
                  className="mt-4 self-center text-[15px] underline decoration-1 underline-offset-4"
                >
                  {t('retake.zen')}
                </Link>
              </StepActions>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
