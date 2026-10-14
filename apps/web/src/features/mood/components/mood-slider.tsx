'use client'

import { isMoodLevel, labelOf, maxMoodLevel, moodLabels, type MoodLevel } from '../mood-levels'

interface MoodSliderProps {
  level: MoodLevel
  labelledBy: string
  onChange: (level: MoodLevel) => void
}

export function MoodSlider({ level, labelledBy, onChange }: MoodSliderProps) {
  return (
    <div>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[14px] top-1/2 flex justify-between"
        >
          {moodLabels.map((label) => (
            <span key={label} className="-mt-[4.5px] h-[9px] w-px bg-rule" />
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={maxMoodLevel}
          step={1}
          value={level}
          aria-labelledby={labelledBy}
          aria-valuetext={labelOf(level)}
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
        <span>muito mal</span>
        <span>muito bem</span>
      </div>
    </div>
  )
}
