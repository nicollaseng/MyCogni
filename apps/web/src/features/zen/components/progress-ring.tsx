import { cn } from '@/shared/lib/utils'

interface ProgressRingProps {
  done: number
  total: number
  className?: string
}

const radius = 9

const circumference = 2 * Math.PI * radius

export function ProgressRing({ done, total, className }: ProgressRingProps) {
  const share = total === 0 ? 0 : Math.min(done / total, 1)

  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn('size-6 shrink-0 -rotate-90', className)}>
      <circle cx="12" cy="12" r={radius} fill="none" stroke="var(--rule)" strokeWidth="2" />
      {share > 0 && (
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          stroke="var(--emphasis)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${String(circumference * share)} ${String(circumference)}`}
        />
      )}
    </svg>
  )
}
