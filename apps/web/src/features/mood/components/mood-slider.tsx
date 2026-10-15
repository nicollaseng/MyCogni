'use client'

import { useTranslations } from 'next-intl'
import { isMoodLevel, maxMoodLevel, moodKeyOf, moodKeys, type MoodLevel } from '../mood-levels'

interface MoodSliderProps {
  level: MoodLevel
  labelledBy: string
  onChange: (level: MoodLevel) => void
}

export function MoodSlider({ level, labelledBy, onChange }: MoodSliderProps) {
  const t = useTranslations('common.mood')

  return (
    <div>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[14px] top-1/2 flex justify-between"
        >
          {moodKeys.map((key) => (
            <span key={key} className="-mt-[4.5px] h-[9px] w-px bg-rule" />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={maxMoodLevel}
          step={1}
          value={level}
          aria-labelledby={labelledBy}
          aria-valuetext={t(moodKeyOf(level))}
          onChange={(event) => {
            const next = Number(event.currentTarget.value)
            if (isMoodLevel(next)) {
              onChange(next)
            }
          }}
          className="mood-range relative"
        />
      </div>
      <div className="mt-1 flex justify-between text-xs tracking-[0.02em] text-muted-foreground">
        <span>{t('scaleLow')}</span>
        <span>{t('scaleHigh')}</span>
      </div>
    </div>
  )
}
