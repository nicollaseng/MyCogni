import type { AmbientLoopId } from '@mycogni/domain'
import { cn } from '@/shared/lib/utils'

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

const shapes: Readonly<Record<AmbientLoopId, string>> = {
  sea: 'M3 10c3-3 6-3 9 0s6 3 9 0M3 15c3-3 6-3 9 0s6 3 9 0',
  rain: 'M9 4.5s-4 4.8-4 7.8a4 4 0 0 0 8 0c0-3-4-7.8-4-7.8ZM17 11s-2.5 3-2.5 4.8a2.5 2.5 0 0 0 5 0c0-1.8-2.5-4.8-2.5-4.8Z',
  forest: 'M12 3.5L7 10h3l-4 6h12l-4-6h3ZM12 16v4.5',
  'night-forest':
    'M9 7.5l-4.5 6h2.8l-3.3 5h10l-3.3-5h2.8ZM9 18.5v2.5M20 9.2a3.6 3.6 0 0 1-4.6-4.6a3.6 3.6 0 1 0 4.6 4.6Z',
  birdsong:
    'M3.5 14.5c2.6.4 4.6-.6 6-2.7l1.6-2.5c.9-1.4 2.3-2.3 3.9-2.3 1.5 0 2.7.9 3.1 2.2l2.4.8-2.4.9c-.4 4-3.6 7.1-7.6 7.1H8.5M10.5 13.5c1.7.6 3.5.3 4.8-.9',
  meadow:
    'M3 20h18M8 20c0-4-1.2-7-3.5-9M11 20c0-4.5.4-8 1.6-11M14 20c0-4 1-7.5 3-10M17.5 20c0-2.6.9-4.8 3-6.5',
  campfire:
    'M12 3.5c.4 2.8 4.5 4.5 4.5 8.6a4.5 4.5 0 0 1-9 0c0-2 .9-3.4 2.1-4.4.2 1.6.9 2.5 1.9 2.8 0-2.3-.5-4.5.5-7ZM5.5 20.5l13-3.5M5.5 17l13 3.5',
  'mountain-wind': 'M2.5 19.5l6.5-10 4 6 2.5-3.5 6 7.5ZM13.5 6.5h5a1.5 1.5 0 1 0-1.4-2M11 9h4.5',
  snow: 'M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9M9.6 4.6L12 6.6l2.4-2M9.6 19.4l2.4-2 2.4 2',
  owl: 'M6 9.5C6 6.2 8.7 4.5 12 4.5s6 1.7 6 5V15a6 6 0 0 1-12 0ZM6.5 5.5L5.5 3.5M17.5 5.5l1-2M10.2 10.5a1.6 1.6 0 1 1-3.2 0a1.6 1.6 0 0 1 3.2 0ZM17 10.5a1.6 1.6 0 1 1-3.2 0a1.6 1.6 0 0 1 3.2 0ZM12 12.5v1.5',
  'brown-noise': 'M4 10.5v3M7 8v8M10 10v4M13 6v12M16 9v6M19 11v2',
}

export function SoundIcon({ sound, className }: { sound: AmbientLoopId; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      data-sound={sound}
      className={cn('size-5 shrink-0', className)}
    >
      <path d={shapes[sound]} {...line} />
    </svg>
  )
}
