'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { MoodMap } from '@/features/mood/components/mood-map'
import { MoodSlider } from '@/features/mood/components/mood-slider'
import {
  labelOf,
  moodColor,
  neutralMood,
  valenceOf,
  type MoodLevel,
} from '@/features/mood/mood-levels'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

export function MoodDemo() {
  const [level, setLevel] = useState<MoodLevel>(neutralMood)
  const questionId = useId()
  const valence = valenceOf(level)

  return (
    <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <div className="grid place-items-center lg:order-2">
        <MoodMap valence={valence} className="h-auto w-[min(76vw,460px)]" />
      </div>

      <div className="lg:order-1">
        <p className="text-sm text-muted-foreground">Diário de humor</p>
        <h1
          id={questionId}
          className="mt-3 font-serif text-[44px] leading-[1.04] tracking-[-0.02em] sm:text-[58px]"
        >
          Como você está agora?
        </h1>
        <p className="mt-5 max-w-[30rem] text-lg leading-relaxed text-muted-foreground">
          Arraste e veja o mapa responder. Um registro leva menos de um minuto, e a cada duas
          semanas o <span className="whitespace-nowrap">PHQ-9</span> e o{' '}
          <span className="whitespace-nowrap">GAD-7</span> mostram como ansiedade e humor mudam com
          o tempo.
        </p>

        <div className="mt-8 max-w-[26rem]">
          <p
            aria-hidden
            className="font-serif text-[28px] italic tracking-[-0.01em]"
            style={{ color: `color-mix(in oklab, ${moodColor(valence)} 70%, var(--foreground))` }}
          >
            {labelOf(level)}
          </p>
          <MoodSlider level={level} labelledBy={questionId} onChange={setLevel} />
        </div>

        <Link
          href="/today"
          className={cn(buttonVariants({ size: 'lg', shape: 'pill' }), 'mt-9 px-9')}
        >
          Começar
        </Link>
      </div>
    </div>
  )
}
