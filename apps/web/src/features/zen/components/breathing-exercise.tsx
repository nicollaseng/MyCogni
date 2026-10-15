'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useReducer } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { Button } from '@/shared/ui/button'
import { breathingRounds, exerciseMs, momentAt, pointAt, sideOf } from '../breathing'

export const breathingTick = 100

type Status = 'idle' | 'running' | 'paused' | 'finished'

interface State {
  status: Status
  elapsed: number
}

type Action = 'toggle' | 'restart' | 'tick'

const idle: State = { status: 'idle', elapsed: 0 }

function reduce(state: State, action: Action): State {
  if (action === 'restart') {
    return { status: 'running', elapsed: 0 }
  }
  if (action === 'tick') {
    const elapsed = state.elapsed + breathingTick
    return elapsed >= exerciseMs ? { status: 'finished', elapsed } : { ...state, elapsed }
  }
  const next: Record<Status, State> = {
    idle: { status: 'running', elapsed: 0 },
    running: { ...state, status: 'paused' },
    paused: { ...state, status: 'running' },
    finished: { status: 'running', elapsed: 0 },
  }
  return next[state.status]
}

export function BreathingExercise() {
  const t = useTranslations('zen.breathing')
  const reducedMotion = usePrefersReducedMotion()
  const [{ status, elapsed }, dispatch] = useReducer(reduce, idle)
  const moment = momentAt(elapsed)
  const active = status === 'running' || status === 'paused'
  const point = pointAt(moment)
  const side = sideOf(moment.side)

  useEffect(() => {
    if (status !== 'running') {
      return undefined
    }
    const timer = window.setInterval(() => {
      dispatch('tick')
    }, breathingTick)
    return () => {
      window.clearInterval(timer)
    }
  }, [status])

  const primary: Record<Status, string> = {
    idle: t('start'),
    running: t('pause'),
    paused: t('resume'),
    finished: t('restart'),
  }
  const headline =
    status === 'finished' ? t('finished') : active ? t(`phases.${moment.phase}`) : t('ready')

  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">{t('intro')}</p>
      <div
        className="relative mx-auto aspect-square w-full max-w-[15rem]"
        data-testid="breathing-square"
      >
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className="absolute inset-0 size-full overflow-visible"
        >
          <rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="none"
            stroke="var(--rule)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
          />
          {active && (
            <line
              data-side={moment.phase}
              x1={side.from.x}
              y1={side.from.y}
              x2={side.to.x}
              y2={side.to.y}
              stroke="var(--foreground)"
              strokeWidth={2}
              strokeLinecap="square"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        {active && !reducedMotion && (
          <span
            aria-hidden
            data-testid="breathing-dot"
            className="absolute size-3 -translate-1/2 rounded-full bg-foreground transition-[left,top] duration-100 ease-linear"
            style={{ left: `${String(point.x)}%`, top: `${String(point.y)}%` }}
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-6 text-center">
          <p className="font-serif text-[28px] leading-tight tracking-[-0.01em] text-balance">
            {headline}
          </p>
          {active && (
            <p aria-hidden className="text-lg text-muted-foreground tabular-nums">
              {moment.count}
            </p>
          )}
        </div>
      </div>
      <p role="status" className="sr-only">
        {active ? t(`phases.${moment.phase}`) : status === 'finished' ? t('finished') : ''}
      </p>
      <p className="text-center text-sm text-muted-foreground tabular-nums">
        {t('round', {
          current: status === 'idle' ? 1 : moment.round,
          total: breathingRounds,
        })}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          size="lg"
          className="w-full sm:flex-1"
          onClick={() => {
            dispatch('toggle')
          }}
        >
          {primary[status]}
        </Button>
        {active && (
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:flex-1"
            onClick={() => {
              dispatch('restart')
            }}
          >
            {t('restart')}
          </Button>
        )}
      </div>
    </div>
  )
}
