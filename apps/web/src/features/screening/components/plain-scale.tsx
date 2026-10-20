import { plainLevelRank, plainLevels, type PlainLevel } from '@mycogni/domain'
import { cn } from '@/shared/lib/utils'

export function PlainScale({ level, className }: { level: PlainLevel; className?: string }) {
  const rank = plainLevelRank(level)

  return (
    <div aria-hidden className={cn('flex gap-1', className)}>
      {plainLevels.map((step, index) => (
        <span
          key={step}
          data-filled={index <= rank}
          className={cn('h-1.5 flex-1 rounded-xs', index <= rank ? 'bg-foreground' : 'bg-rule')}
        />
      ))}
    </div>
  )
}
