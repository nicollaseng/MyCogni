'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import {
  createContext,
  use,
  useId,
  useState,
  useSyncExternalStore,
  useTransition,
  type ReactNode,
} from 'react'
import type { ActionResult } from '@/shared/lib/actions/result'
import { Button } from '@/shared/ui/button'

const dismissedKey = 'mycogni.reminderOffer'

interface OfferContext {
  time: string
  accept: (time: string) => Promise<ActionResult<string>>
}

const ReminderOfferContext = createContext<OfferContext | null>(null)

interface ReminderOfferProviderProps extends OfferContext {
  offer: boolean
  children: ReactNode
}

export function ReminderOfferProvider({
  offer,
  time,
  accept,
  children,
}: ReminderOfferProviderProps) {
  return (
    <ReminderOfferContext value={offer ? { time, accept } : null}>{children}</ReminderOfferContext>
  )
}

const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(dismissedKey) === 'done'
  } catch {
    return false
  }
}

function dismiss(): void {
  try {
    window.localStorage.setItem(dismissedKey, 'done')
  } catch {
    return
  } finally {
    for (const listener of listeners) {
      listener()
    }
  }
}

export function useReminderOfferAvailable(): boolean {
  const context = use(ReminderOfferContext)
  const dismissed = useSyncExternalStore(subscribe, wasDismissed, () => true)
  return context !== null && !dismissed
}

export function ReminderOffer() {
  const context = use(ReminderOfferContext)
  const dismissed = useSyncExternalStore(subscribe, wasDismissed, () => true)
  const [done, setDone] = useState<string | null>(null)
  if (done !== null) {
    return <OfferDone time={done} />
  }
  if (context === null || dismissed) {
    return null
  }
  return <OfferPanel context={context} onDone={setDone} />
}

function OfferDone({ time }: { time: string }) {
  const t = useTranslations('reminders.offer')
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className="w-full max-w-[22rem] space-y-2 text-center">
      <p id={titleId} role="status" className="text-[15px] text-zen-foreground/90">
        {t('done', { time })}
      </p>
      <Link
        href="/me/reminders"
        className="text-sm text-zen-foreground/75 underline decoration-1 underline-offset-4"
      >
        {t('settings')}
      </Link>
    </section>
  )
}

interface OfferPanelProps {
  context: OfferContext
  onDone: (time: string) => void
}

function OfferPanel({ context, onDone }: OfferPanelProps) {
  const t = useTranslations('reminders.offer')
  const titleId = useId()
  const timeId = useId()
  const [time, setTime] = useState(context.time)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <section
      aria-labelledby={titleId}
      className="w-full max-w-[22rem] space-y-4 rounded-[8px] bg-zen-foreground/8 p-5"
    >
      <h3 id={titleId} className="text-[15px] leading-snug text-zen-foreground">
        {t('title')}
      </h3>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={timeId} className="text-sm text-zen-foreground/80">
          {t('time')}
        </label>
        <input
          id={timeId}
          type="time"
          required
          value={time}
          onChange={(event) => {
            setTime(event.currentTarget.value)
          }}
          className="h-10 rounded-md border border-zen-foreground/30 bg-transparent px-3 text-zen-foreground tabular-nums outline-none [color-scheme:dark] focus:border-zen-foreground"
        />
      </div>
      {error !== null && (
        <p role="alert" className="text-sm text-zen-foreground">
          {error}
        </p>
      )}
      <div className="flex gap-2.5">
        <Button
          size="sm"
          variant="inverse"
          disabled={pending}
          className="flex-1"
          onClick={() => {
            startTransition(async () => {
              const result = await context.accept(time)
              if (result.ok) {
                dismiss()
                onDone(result.value)
              } else {
                setError(result.error)
              }
            })
          }}
        >
          {t('accept')}
        </Button>
        <Button size="sm" variant="inverseOutline" disabled={pending} onClick={dismiss}>
          {t('later')}
        </Button>
      </div>
    </section>
  )
}
