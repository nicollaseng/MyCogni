'use client'

import type { QuestionnaireRun } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { SupportStep } from '@/features/screening/components/support-step'
import { StepActions } from '@/shared/components/step-actions'
import { StepHeading } from '@/shared/components/step-heading'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'
import { afterFinish, initialStep, resumeIndex, withLocalAnswer, type RunStep } from '../run'
import { RunIntro } from './run-intro'
import { RunQuestion } from './run-question'
import { RunSummary } from './run-summary'

type RunAction = (id: string) => Promise<ActionResult<QuestionnaireRun>>

export interface RunActions {
  begin: RunAction
  save: (id: string, item: number, value: number) => Promise<ActionResult<QuestionnaireRun>>
  finish: RunAction
}

interface RunFlowProps {
  initial: QuestionnaireRun
  actions: RunActions
}

const advanceDelay = 220

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function Closed() {
  const t = useTranslations('questionnaires.closed')
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <StepHeading title={t('title')}>{t('body')}</StepHeading>
      <StepActions>
        <Link href="/me/questionnaires" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
          {t('back')}
        </Link>
      </StepActions>
    </section>
  )
}

export function RunFlow({ initial, actions }: RunFlowProps) {
  const t = useTranslations('questionnaires')
  const [run, setRun] = useState(initial)
  const [step, setStep] = useState<RunStep>(() => initialStep(initial))
  const [index, setIndex] = useState(() => resumeIndex(initial.answers))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef<{ item: number; value: number } | null>(null)

  async function start() {
    setBusy(true)
    setError(null)
    const result = await actions.begin(run.id)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRun(result.value)
    setIndex(resumeIndex(result.value.answers))
    setStep(initialStep(result.value))
  }

  async function finish() {
    const result = await actions.finish(run.id)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setRun(result.value)
    setStep(afterFinish(result.value))
  }

  async function save(item: number, value: number) {
    pending.current = { item, value }
    setBusy(true)
    setError(null)
    const [result] = await Promise.all([actions.save(run.id, item, value), wait(advanceDelay)])
    if (!result.ok) {
      setBusy(false)
      setError(result.error)
      return
    }
    pending.current = null
    setRun(result.value)
    if (item < result.value.answers.length - 1) {
      setIndex(item + 1)
    } else {
      await finish()
    }
    setBusy(false)
  }

  function retry() {
    const last = pending.current
    if (last === null) {
      void finish()
      return
    }
    void save(last.item, last.value)
  }

  return (
    <div className="flex h-dvh flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[460px] flex-1 flex-col px-6 pt-5">
        <header className="flex h-11 shrink-0 items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('label')}</span>
          {step === 'questions' && <Link href="/me/questionnaires">{t('question.pause')}</Link>}
        </header>
        <main
          key={step}
          className="flex min-h-0 flex-1 animate-rise flex-col motion-reduce:animate-none"
        >
          {step === 'intro' && (
            <RunIntro run={run} starting={busy} error={error} onStart={() => void start()} />
          )}
          {step === 'questions' && run.content !== null && (
            <RunQuestion
              content={run.content}
              index={index}
              selected={run.answers[index] ?? null}
              saving={busy}
              error={error}
              onChoose={(value) => {
                setRun({ ...run, answers: withLocalAnswer(run.answers, index, value) })
                void save(index, value)
              }}
              onBack={
                index === 0 || busy
                  ? null
                  : () => {
                      setIndex(index - 1)
                    }
              }
              onRetry={retry}
            />
          )}
          {step === 'support' && (
            <SupportStep
              continueLabel={t('support.continue')}
              onContinue={() => {
                setStep('summary')
              }}
            />
          )}
          {step === 'summary' && run.summary !== null && <RunSummary summary={run.summary} />}
          {step === 'closed' && <Closed />}
        </main>
      </div>
    </div>
  )
}
