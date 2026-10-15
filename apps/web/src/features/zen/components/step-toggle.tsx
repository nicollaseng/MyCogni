'use client'

import type { ZenStepParams } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import { useOptimistic, useState, useTransition } from 'react'
import { ActionError } from '@/shared/components/action-error'
import type { ActionResult } from '@/shared/lib/actions/result'
import { cn } from '@/shared/lib/utils'

export type SaveStep = (step: ZenStepParams, done: boolean) => Promise<ActionResult<null>>

interface StepToggleProps {
  step: ZenStepParams
  done: boolean
  describedBy: string
  save: SaveStep
}

export function StepToggle({ step, done, describedBy, save }: StepToggleProps) {
  const t = useTranslations('zen.track')
  const [pending, startTransition] = useTransition()
  const [received, setReceived] = useState(done)
  const [saved, setSaved] = useState(done)
  const [shown, setShown] = useOptimistic(saved)
  const [error, setError] = useState<string | null>(null)
  if (received !== done) {
    setReceived(done)
    setSaved(done)
  }

  function toggle() {
    const next = !saved
    setError(null)
    startTransition(async () => {
      setShown(next)
      const result = await save(step, next)
      if (result.ok) {
        setSaved(next)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-pressed={shown}
        aria-describedby={describedBy}
        disabled={pending}
        onClick={toggle}
        className={cn(
          '-mr-2.5 inline-flex h-9 items-center gap-2 rounded-md px-2.5 text-sm transition-colors duration-150 hover:bg-sage motion-reduce:transition-none',
          shown ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'size-2.5 rounded-full border-[1.5px] transition-colors duration-150 motion-reduce:transition-none',
            shown ? 'border-emphasis bg-emphasis' : 'border-foreground/40',
          )}
        />
        {shown ? t('done') : t('markDone')}
      </button>
      {pending && (
        <p role="status" className="text-xs text-muted-foreground">
          {t('saving')}
        </p>
      )}
      <ActionError error={error} />
    </div>
  )
}
