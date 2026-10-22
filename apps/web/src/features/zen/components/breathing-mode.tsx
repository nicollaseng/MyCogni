'use client'

import { useTranslations } from 'next-intl'
import { useId } from 'react'
import { ClientPortal } from '@/shared/components/client-portal'
import { CloseIcon } from '@/shared/components/icons'
import { useModalPanel } from '@/shared/hooks/use-modal-panel'
import { cn } from '@/shared/lib/utils'
import { BreathingExercise } from './breathing-exercise'

export const breathingModeDuration = 320

interface BreathingModeProps {
  onClose: () => void
}

function BreathingLayer({ onClose }: BreathingModeProps) {
  const t = useTranslations('zen.breathing')
  const titleId = useId()
  const { panel, closing, close, onKeyDown } = useModalPanel<HTMLDivElement>(
    onClose,
    breathingModeDuration,
  )

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cn(
        'on-zen fixed inset-0 z-50 flex flex-col overflow-y-auto bg-zen outline-none transition-opacity duration-[320ms] ease-out starting:opacity-0 motion-reduce:transition-none',
        closing && 'opacity-0',
      )}
    >
      <div className="relative flex items-center justify-between gap-4 px-5 pt-4 sm:px-8 sm:pt-6">
        <h2 id={titleId} className="text-[15px] text-zen-foreground/75">
          {t('title')}
        </h2>
        <button
          type="button"
          onClick={close}
          aria-label={t('close')}
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-md text-zen-foreground/80 transition-colors hover:bg-zen-foreground/10 hover:text-zen-foreground motion-reduce:transition-none"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
        <BreathingExercise onClose={close} />
      </div>
    </div>
  )
}

export function BreathingMode({ onClose }: BreathingModeProps) {
  return (
    <ClientPortal>
      <BreathingLayer onClose={onClose} />
    </ClientPortal>
  )
}
