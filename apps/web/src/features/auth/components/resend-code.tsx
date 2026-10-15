'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useEffect, useState } from 'react'
import { initialFormState, type FormState } from '../form-state'
import { authLink } from './auth-footnote'
import { FormFeedback } from './form-feedback'

export const resendCooldownMs = 60_000

interface ResendCodeProps {
  action: (state: FormState) => Promise<FormState>
  sentAt: number | null
  now: number
}

export function countdownOf(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${String(Math.floor(seconds / 60))}:${String(seconds % 60).padStart(2, '0')}`
}

export function ResendCode({ action, sentAt, now }: ResendCodeProps) {
  const t = useTranslations('auth.resend')
  const [availableAt, setAvailableAt] = useState((sentAt ?? 0) + resendCooldownMs)
  const [clock, setClock] = useState(now)
  const [state, formAction, pending] = useActionState(async (previous: FormState) => {
    const next = await action(previous)
    if (next.notice !== null) {
      const sent = Date.now()
      setAvailableAt(sent + resendCooldownMs)
      setClock(sent)
    }
    return next
  }, initialFormState)
  const remaining = availableAt - clock
  const waiting = remaining > 0

  useEffect(() => {
    if (!waiting) {
      return
    }
    const timer = setInterval(() => {
      setClock(Date.now())
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [waiting])

  return (
    <div className="space-y-1 text-center text-sm text-muted-foreground">
      {waiting ? (
        <p>{t('wait', { time: countdownOf(remaining) })}</p>
      ) : (
        <p>
          {t('prompt')}{' '}
          <button
            type="submit"
            formAction={formAction}
            formNoValidate
            disabled={pending}
            className={authLink}
          >
            {pending ? t('sending') : t('action')}
          </button>
        </p>
      )}
      <FormFeedback state={state} />
    </div>
  )
}
