'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { moodColor, moodKeyOf, valenceOf, type MoodLevel } from '@/features/mood/mood-levels'
import { cn } from '@/shared/lib/utils'

const levels: readonly MoodLevel[] = [0, 1, 2, 3, 4, 5, 6]

interface FeelingPromptProps {
  question: string
  onFeel: (level: MoodLevel) => Promise<boolean>
  onSkip?: () => void
}

export function FeelingPrompt({ question, onFeel, onSkip }: FeelingPromptProps) {
  const mood = useTranslations('common.mood')
  const t = useTranslations('zen.feeling')
  const [chosen, setChosen] = useState<MoodLevel | null>(null)
  const [saved, setSaved] = useState(false)

  async function choose(level: MoodLevel) {
    setChosen(level)
    setSaved(await onFeel(level))
  }

  return (
    <div className="flex flex-col items-center gap-3" data-testid="feeling-prompt">
      <p className="text-[15px] text-zen-foreground/85">{question}</p>
      <div role="group" aria-label={question} className="flex items-center gap-2.5">
        {levels.map((level) => (
          <button
            key={level}
            type="button"
            aria-pressed={chosen === level}
            aria-label={mood(moodKeyOf(level))}
            title={mood(moodKeyOf(level))}
            disabled={chosen !== null}
            onClick={() => void choose(level)}
            className={cn(
              'size-8 rounded-full border border-zen-foreground/25 transition-[transform,box-shadow] duration-150 hover:scale-110 disabled:cursor-default disabled:hover:scale-100 motion-reduce:transition-none sm:size-9',
              chosen === level && 'shadow-[0_0_0_2px_var(--zen),0_0_0_4px_var(--zen-foreground)]',
              chosen !== null && chosen !== level && 'opacity-40',
            )}
            style={{ backgroundColor: moodColor(valenceOf(level)) }}
          />
        ))}
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-zen-foreground/75">
        {chosen === null ? '' : saved ? t('saved', { mood: mood(moodKeyOf(chosen)) }) : ''}
      </p>
      {onSkip !== undefined && chosen === null && (
        <button
          type="button"
          onClick={onSkip}
          className="-mt-2 min-h-10 px-2 text-sm text-zen-foreground/70 underline decoration-1 underline-offset-4 hover:text-zen-foreground"
        >
          {t('skip')}
        </button>
      )}
    </div>
  )
}
