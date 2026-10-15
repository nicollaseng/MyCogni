'use client'

import type { ProfessionalAlert } from '@mycogni/contracts'
import type { AlertLevel, AlertStatus } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useSubmit } from '@/shared/hooks/use-submit'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'

export type AlertAction = (id: string) => Promise<ActionResult<null>>

export interface AlertActions {
  acknowledge: AlertAction
  resolve: AlertAction
}

const levelDots: Record<AlertLevel, string> = {
  urgent: 'bg-danger',
  watch: 'bg-(--warn)',
  info: 'bg-help',
}

const statusDots: Record<AlertStatus, string> = {
  open: 'bg-foreground',
  acknowledged: 'bg-transparent ring-1 ring-foreground/60 ring-inset',
  resolved: 'bg-muted-foreground/40',
}

const actionButton =
  'inline-flex h-8 items-center rounded-[6px] border border-rule px-2.5 text-sm whitespace-nowrap text-foreground transition-colors hover:bg-background disabled:pointer-events-none disabled:opacity-50'

export function AlertLevelLabel({ level }: { level: AlertLevel }) {
  const t = useTranslations('alerts.levels')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap',
        level === 'urgent' && 'font-medium text-danger',
      )}
    >
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', levelDots[level])} />
      {t(level)}
    </span>
  )
}

export function AlertStatusLabel({ status }: { status: AlertStatus }) {
  const t = useTranslations('alerts.statuses')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 whitespace-nowrap',
        status === 'resolved' && 'text-muted-foreground',
      )}
    >
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', statusDots[status])} />
      {t(status)}
    </span>
  )
}

export function useAlertActions({ acknowledge, resolve }: AlertActions) {
  const t = useTranslations('alerts')
  const [notice, setNotice] = useState<string | null>(null)
  const acknowledging = useSubmit(acknowledge, () => {
    setNotice(t('acknowledged'))
  })
  const resolving = useSubmit(resolve, () => {
    setNotice(t('resolved'))
  })
  return {
    notice,
    error: acknowledging.error ?? resolving.error,
    pending: acknowledging.pending || resolving.pending,
    acknowledge(id: string) {
      setNotice(null)
      acknowledging.submit(id)
    },
    resolve(id: string) {
      setNotice(null)
      resolving.submit(id)
    },
  }
}

export type AlertActionState = ReturnType<typeof useAlertActions>

export function ActionFeedback({ state }: { state: AlertActionState }) {
  return (
    <div className="min-h-5 text-sm">
      {state.error !== null ? (
        <p role="alert" className="text-danger">
          {state.error}
        </p>
      ) : (
        <p role="status">{state.notice}</p>
      )}
    </div>
  )
}

interface AlertButtonsProps {
  alert: ProfessionalAlert
  name: string
  state: AlertActionState
}

export function AlertButtons({ alert, name, state }: AlertButtonsProps) {
  const t = useTranslations('alerts')
  if (alert.status === 'resolved') {
    return null
  }
  const reason = t(`reasons.${alert.reason}`)
  return (
    <div className="flex items-center justify-end gap-1.5">
      {alert.status === 'open' && (
        <button
          type="button"
          disabled={state.pending}
          aria-label={t('acknowledgeLabel', { reason, name })}
          className={actionButton}
          onClick={() => {
            state.acknowledge(alert.id)
          }}
        >
          {t('acknowledge')}
        </button>
      )}
      <button
        type="button"
        disabled={state.pending}
        aria-label={t('resolveLabel', { reason, name })}
        className={actionButton}
        onClick={() => {
          state.resolve(alert.id)
        }}
      >
        {t('resolve')}
      </button>
    </div>
  )
}
