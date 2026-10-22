import type { SoundProgrammeId } from '@mycogni/domain'
import { cn } from '@/shared/lib/utils'

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const shapes: Readonly<Record<SoundProgrammeId, string>> = {
  calm: 'M3 10.5c3-2.5 6-2.5 9 0s6 2.5 9 0M6 15c2-1.6 4-1.6 6 0s4 1.6 6 0',
  meditate:
    'M12 4.5a2 2 0 1 1 0 4a2 2 0 0 1 0-4ZM6 17.5c1.4-3.6 3.4-5.5 6-5.5s4.6 1.9 6 5.5M4 20h16',
  sleep: 'M18.5 14.5A7.5 7.5 0 0 1 9.5 5.5a7.5 7.5 0 1 0 9 9ZM15.5 4.5h3l-3 3h3',
  focus:
    'M12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10ZM12 11a1 1 0 1 1 0 2a1 1 0 0 1 0-2ZM12 3v2M12 19v2M3 12h2M19 12h2',
  lift: 'M3.5 18h17M7 18a5 5 0 0 1 10 0M12 6.5v3M5.8 10.8l1.9 1.3M18.2 10.8l-1.9 1.3',
  ease: 'M5 19c0-7.5 5-12.5 14-14-1.2 9-6.2 14-14 14ZM5 19l8-8',
}

export function ProgrammeIcon({ id, className }: { id: SoundProgrammeId; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" data-programme={id} className={cn('size-6', className)}>
      <path d={shapes[id]} {...line} />
    </svg>
  )
}
