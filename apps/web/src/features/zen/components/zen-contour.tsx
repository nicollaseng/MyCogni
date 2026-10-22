'use client'

import { contourPath, ringOpacity } from '@/features/mood/contour'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'
import { useContourDrift } from '../use-contour-drift'

interface ZenContourProps {
  rings?: number
  calm?: number
  drift?: boolean
  className?: string
}

const driftSpeed = 0.18

export function ZenContour({ rings = 9, calm = 0.82, drift = true, className }: ZenContourProps) {
  const reducedMotion = usePrefersReducedMotion()
  const track = useContourDrift({ rings, valence: calm }, drift && !reducedMotion, driftSpeed)

  return (
    <svg
      viewBox="0 0 300 300"
      aria-hidden
      className={cn('pointer-events-none overflow-visible', className)}
    >
      {Array.from({ length: rings }, (_, ring) => (
        <path
          key={ring}
          ref={track(ring)}
          d={contourPath(ring, { rings, valence: calm, time: 0 })}
          fill="none"
          stroke="currentColor"
          strokeOpacity={ringOpacity(ring, rings)}
          strokeWidth={ring === 0 ? 1.4 : 1}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
