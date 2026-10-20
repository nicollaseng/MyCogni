'use client'

import { useEffect, useRef } from 'react'
import { contourPath, ringOpacity } from '@/features/mood/contour'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'

interface ZenContourProps {
  rings?: number
  calm?: number
  drift?: boolean
  className?: string
}

const frameMs = 60

const driftSpeed = 0.18

export function ZenContour({ rings = 9, calm = 0.82, drift = true, className }: ZenContourProps) {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const reducedMotion = usePrefersReducedMotion()
  const moving = drift && !reducedMotion

  useEffect(() => {
    if (!moving) {
      return undefined
    }
    let frame = 0
    let last = 0
    const render = (now: number) => {
      if (now - last >= frameMs) {
        last = now
        const time = (now / 1000) * driftSpeed
        paths.current.forEach((path, ring) => {
          path?.setAttribute('d', contourPath(ring, { rings, valence: calm, time }))
        })
      }
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [moving, rings, calm])

  return (
    <svg
      viewBox="0 0 300 300"
      aria-hidden
      className={cn('pointer-events-none overflow-visible', className)}
    >
      {Array.from({ length: rings }, (_, ring) => (
        <path
          key={ring}
          ref={(element) => {
            paths.current[ring] = element
          }}
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
