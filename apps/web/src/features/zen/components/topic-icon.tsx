import type { TopicId } from '@mycogni/domain'
import { cn } from '@/shared/lib/utils'

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const shapes: Readonly<Record<TopicId, string>> = {
  anxiety: 'M3 9c3-3 6-3 9 0s6 3 9 0M3 15c3-3 6-3 9 0s6 3 9 0',
  mood: 'M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4M15.5 12a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z',
  sleep: 'M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5ZM16 4h3l-3 3h3',
  performance: 'M3 19l6.5-10 4 6 2.5-3.5L21 19ZM9.5 9l1.5-2.3',
  help: 'M12 20s-7-4.4-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5c0 5.1-7 9.5-7 9.5Z',
}

export function TopicIcon({ id, className }: { id: TopicId; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn('size-7', className)}>
      <path d={shapes[id]} {...line} />
    </svg>
  )
}

export function ReadingIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn('size-5 shrink-0', className)}>
      <path
        d="M4 6.5C6.5 5 9.5 5 12 6.5c2.5-1.5 5.5-1.5 8 0V18c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0ZM12 6.5V18"
        {...line}
      />
    </svg>
  )
}
