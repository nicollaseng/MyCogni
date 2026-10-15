import { cn } from '@/shared/lib/utils'

export type TrackStatus = 'new' | 'started' | 'complete'

const dotStyles: Record<TrackStatus, string> = {
  new: 'border-foreground/40',
  started: 'border-foreground bg-foreground',
  complete: 'border-emphasis bg-emphasis',
}

export function StatusDot({ status }: { status: TrackStatus }) {
  return (
    <span
      aria-hidden
      className={cn('size-2 shrink-0 rounded-full border-[1.5px]', dotStyles[status])}
    />
  )
}
