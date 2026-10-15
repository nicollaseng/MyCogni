'use client'

import { toggleMoodLevel, type MoodRange } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { moodColor, moodKeyOf, valenceOf, type MoodLevel } from '@/features/mood/mood-levels'
import { cn } from '@/shared/lib/utils'
import { useMoodRangeText } from '../use-filter-summary'

const levels: readonly MoodLevel[] = [0, 1, 2, 3, 4, 5, 6]

interface MoodScaleProps {
  label: string
  value: MoodRange | null
  onChange: (value: MoodRange | null) => void
}

export function MoodScale({ label, value, onChange }: MoodScaleProps) {
  const mood = useTranslations('common.mood')
  const describe = useMoodRangeText()

  return (
    <div className="space-y-2">
      <div role="group" aria-label={label} className="flex gap-1">
        {levels.map((level) => {
          const selected = value !== null && level >= value.min && level <= value.max
          const color = moodColor(valenceOf(level))
          return (
            <button
              key={level}
              type="button"
              aria-pressed={selected}
              aria-label={mood(moodKeyOf(level))}
              title={mood(moodKeyOf(level))}
              onClick={() => {
                onChange(toggleMoodLevel(value, level))
              }}
              className={cn(
                'h-10 min-w-0 flex-1 cursor-pointer rounded-[4px] transition-[background-color,box-shadow] duration-150 motion-reduce:transition-none',
                selected && 'shadow-[inset_0_0_0_2px_var(--foreground)]',
              )}
              style={{
                backgroundColor: selected
                  ? color
                  : `color-mix(in oklab, ${color} 30%, transparent)`,
              }}
            />
          )
        })}
      </div>
      <div aria-hidden className="flex justify-between text-xs text-muted-foreground">
        <span>{mood('veryBad')}</span>
        <span>{mood('veryGood')}</span>
      </div>
      <p aria-live="polite" className="text-sm">
        {describe(value)}
      </p>
    </div>
  )
}
