import type { PracticeDay } from '@mycogni/domain'
import { cn } from '@/shared/lib/utils'

const levels: Readonly<Record<PracticeDay['level'], string>> = {
  0: 'bg-foreground/[0.07]',
  1: 'bg-emphasis/30',
  2: 'bg-emphasis/50',
  3: 'bg-emphasis/75',
  4: 'bg-emphasis',
}

interface PracticeMapProps {
  days: readonly PracticeDay[]
  label: string
  large?: boolean
}

export function PracticeMap({ days, label, large = false }: PracticeMapProps) {
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, week) =>
    days.slice(week * 7, week * 7 + 7),
  )

  return (
    <div role="img" aria-label={label} data-testid="practice-map" className="flex gap-1">
      {weeks.map((week) => (
        <div key={week[0]?.day} className="flex flex-col gap-1">
          {week.map((day) => (
            <span
              key={day.day}
              data-day={day.day}
              data-level={day.future ? 'future' : day.level}
              className={cn(
                'block rounded-[2px]',
                large ? 'size-3.5 sm:size-4' : 'size-3 sm:size-3.5',
                day.future ? 'bg-transparent' : levels[day.level],
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
