'use client'

import { useId } from 'react'
import { MoodMap } from '@/features/mood/components/mood-map'
import { MoodSlider } from '@/features/mood/components/mood-slider'
import { labelOf, moodColor, valenceOf, type MoodLevel } from '@/features/mood/mood-levels'
import { Button } from '@/shared/ui/button'
import { StepActions } from '@/shared/components/step-actions'

interface MoodStepProps {
  today: string
  level: MoodLevel
  onChange: (level: MoodLevel) => void
  onContinue: () => void
  onFinish: () => void
}

export function MoodStep({ today, level, onChange, onContinue, onFinish }: MoodStepProps) {
  const questionId = useId()
  const valence = valenceOf(level)

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <p className="mt-6 text-[13px] text-muted-foreground">{today}</p>
      <h1 id={questionId} className="mt-2 font-serif text-[34px] leading-[1.08] tracking-[-0.02em]">
        Como você está agora?
      </h1>
      <div className="grid min-h-0 flex-1 place-items-center py-4">
        <MoodMap valence={valence} className="h-auto max-h-full w-[min(72vw,300px)]" />
      </div>
      <p
        aria-hidden
        className="min-h-[52px] text-center font-serif text-[40px] italic tracking-[-0.02em]"
        style={{ color: `color-mix(in oklab, ${moodColor(valence)} 70%, var(--foreground))` }}
      >
        {labelOf(level)}
      </p>
      <div className="mt-4">
        <MoodSlider level={level} labelledBy={questionId} onChange={onChange} />
      </div>
      <StepActions>
        <Button size="lg" shape="pill" onClick={onContinue}>
          Continuar
        </Button>
        <Button variant="ghost" size="sm" onClick={onFinish} className="mt-1">
          Registrar só o humor
        </Button>
      </StepActions>
    </section>
  )
}
