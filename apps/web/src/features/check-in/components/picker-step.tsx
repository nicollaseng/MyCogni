'use client'

import type { ReactNode } from 'react'
import { MoodMap } from '@/features/mood/components/mood-map'
import { ActionError } from '@/shared/components/action-error'
import { StepActions } from '@/shared/components/step-actions'
import { Button } from '@/shared/ui/button'
import type { ChoiceGroup } from '../catalog'
import { ChoicePicker } from './choice-picker'

interface PickerStepProps {
  title: string
  valence: number
  tabs: readonly ChoiceGroup[]
  selected: readonly string[]
  onToggle: (item: string) => void
  searchLabel: string
  primaryLabel: string
  onPrimary: () => void
  onSkip?: () => void
  pending?: boolean
  error?: string | null
  children?: ReactNode
}

export function PickerStep({
  title,
  valence,
  tabs,
  selected,
  onToggle,
  searchLabel,
  primaryLabel,
  onPrimary,
  onSkip,
  pending = false,
  error = null,
  children,
}: PickerStepProps) {
  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mt-6 flex items-start justify-between gap-4">
        <h1 className="font-serif text-[34px] leading-[1.08] tracking-[-0.02em]">{title}</h1>
        <MoodMap valence={valence} rings={5} className="mt-0.5 size-[52px] shrink-0" />
      </div>
      <ChoicePicker tabs={tabs} selected={selected} onToggle={onToggle} searchLabel={searchLabel} />
      {children}
      <StepActions>
        <ActionError error={error} />
        <Button size="lg" shape="pill" onClick={onPrimary} disabled={pending}>
          {primaryLabel}
        </Button>
        {onSkip !== undefined && (
          <Button variant="ghost" size="sm" onClick={onSkip} className="mt-1">
            Pular
          </Button>
        )}
      </StepActions>
    </section>
  )
}
