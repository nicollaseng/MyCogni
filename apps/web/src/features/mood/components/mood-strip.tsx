import { cn } from '@/shared/lib/utils'
import { moodColor, valenceOf, type MoodLevel } from '../mood-levels'

interface MoodStripProps {
  days: readonly (MoodLevel | null)[]
  label: string
  className?: string
}

function heightOf(level: MoodLevel): string {
  return `${String(28 + level * 12)}%`
}

export function MoodStrip({ days, label, className }: MoodStripProps) {
  const hasRecords = days.some((level) => level !== null)

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('flex items-end gap-[3px]', hasRecords ? 'h-16 sm:h-20' : 'h-1.5', className)}
    >
      {days.map((level, index) =>
        level === null ? (
          <span key={index} data-day="empty" className="h-1.5 flex-1 rounded-[1px] bg-rule" />
        ) : (
          <span
            key={index}
            data-day={level}
            className="flex-1 rounded-[1px]"
            style={{ height: heightOf(level), backgroundColor: moodColor(valenceOf(level)) }}
          />
        ),
      )}
    </div>
  )
}
