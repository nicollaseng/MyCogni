'use client'

import { breathingContentId } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useEffect, useReducer, useRef, useState } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { ReminderOffer } from '@/features/reminders/components/reminder-offer'
import { Button } from '@/shared/ui/button'
import {
  advance,
  elapsedOf,
  idleRun,
  momentAt,
  type BreathingAction,
  type BreathingStatus,
} from '../breathing'
import { FeelingPrompt } from '../practice/feeling-prompt'
import {
  recordPractice,
  rememberFeeling,
  type RecordPractice,
  type RememberFeeling,
} from '../practice/record'
import { BreathingRelief } from './breathing-relief'

export const breathingTick = 100

const primaryAction: Record<BreathingStatus, BreathingAction['type']> = {
  idle: 'start',
  running: 'pause',
  paused: 'resume',
  finished: 'more',
}

interface BreathingExerciseProps {
  onClose: () => void
  record?: RecordPractice
  remember?: RememberFeeling
}

const minimumUnfinishedMs = 60_000

export function BreathingExercise({
  onClose,
  record = recordPractice,
  remember = rememberFeeling,
}: BreathingExerciseProps) {
  const t = useTranslations('zen.breathing')
  const reducedMotion = usePrefersReducedMotion()
  const [run, dispatch] = useReducer(advance, idleRun)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const startedAt = useRef<Date | null>(null)
  const recordedMs = useRef(0)
  const latest = useRef({ run, record })
  const { status } = run
  const moment = momentAt(elapsedOf(run), run.rounds)
  const active = status === 'running' || status === 'paused'
  const finished = status === 'finished'

  useEffect(() => {
    latest.current = { run, record }
  })

  useEffect(() => {
    if (status !== 'finished') {
      return
    }
    const { run: done, record: save } = latest.current
    const seconds = (done.base - recordedMs.current) / 1000
    recordedMs.current = done.base
    void save({
      kind: 'breathing',
      contentId: breathingContentId,
      startedAt: startedAt.current ?? new Date(),
      seconds,
      completed: true,
    }).then(setSessionId)
  }, [status])

  useEffect(
    () => () => {
      const { run: current, record: save } = latest.current
      const unrecorded = elapsedOf(current) - recordedMs.current
      if (
        (current.status === 'running' || current.status === 'paused') &&
        unrecorded >= minimumUnfinishedMs
      ) {
        void save({
          kind: 'breathing',
          contentId: breathingContentId,
          startedAt: startedAt.current ?? new Date(),
          seconds: unrecorded / 1000,
          completed: false,
        })
      }
    },
    [],
  )

  useEffect(() => {
    if (status !== 'running') {
      return undefined
    }
    const timer = window.setInterval(() => {
      dispatch({ type: 'tick', now: Date.now() })
    }, breathingTick)
    return () => {
      window.clearInterval(timer)
    }
  }, [status])

  const primary: Record<BreathingStatus, string> = {
    idle: t('start'),
    running: t('pause'),
    paused: t('resume'),
    finished: t('more'),
  }
  const word = active ? t(`phases.${moment.phase}`) : finished ? t('done') : null
  const below = active
    ? t('round', { current: moment.round, total: run.rounds })
    : finished
      ? t('howNow')
      : t('intro')

  return (
    <div className="flex w-full flex-col items-center gap-8 sm:gap-10">
      <BreathingRelief
        status={status}
        run={run.run}
        word={word}
        count={active ? moment.count : null}
        reducedMotion={reducedMotion}
      />
      <p role="status" aria-live="polite" className="sr-only">
        {active ? word : finished ? `${t('done')} ${t('howNow')}` : ''}
      </p>
      <div className="flex min-h-[3.25rem] items-start justify-center">
        {finished && sessionId !== null ? (
          <FeelingPrompt question={t('howNow')} onFeel={(level) => remember(sessionId, level)} />
        ) : (
          <p
            className={
              active
                ? 'text-sm text-zen-foreground/75 tabular-nums'
                : 'max-w-[22rem] text-center text-[15px] leading-relaxed text-pretty text-zen-foreground/85'
            }
          >
            {below}
          </p>
        )}
      </div>
      <div className="flex w-full max-w-[22rem] gap-3 sm:justify-center">
        <Button
          size="lg"
          variant={status === 'running' ? 'inverseOutline' : 'inverse'}
          className="flex-1 sm:max-w-48"
          onClick={() => {
            if (status === 'idle') {
              startedAt.current = new Date()
            }
            if (status === 'finished') {
              setSessionId(null)
            }
            dispatch({ type: primaryAction[status], now: Date.now() })
          }}
        >
          {primary[status]}
        </Button>
        {finished && (
          <Button
            size="lg"
            variant="inverseOutline"
            className="flex-1 sm:max-w-48"
            onClick={onClose}
          >
            {t('close')}
          </Button>
        )}
      </div>
      {finished && <ReminderOffer />}
    </div>
  )
}
