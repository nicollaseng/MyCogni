'use client'

import { useEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '@/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@/shared/lib/utils'
import { contourPath, ringOpacity } from '../contour'
import { moodColor } from '../mood-levels'

interface MoodMapProps {
  valence: number
  rings?: number
  className?: string
}

const easing = 0.12

export function MoodMap({ valence, rings = 11, className }: MoodMapProps) {
  const paths = useRef<(SVGPathElement | null)[]>([])
  const target = useRef(valence)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    target.current = valence
  }, [valence])

  useEffect(() => {
    let current = target.current
    let frame = 0
    const render = (now: number) => {
      current += (target.current - current) * easing
      const time = reducedMotion ? 0 : now / 1000
      const color = moodColor(current)
      paths.current.forEach((path, ring) => {
        if (path === null) {
          return
        }
        path.setAttribute('d', contourPath(ring, { rings, valence: current, time }))
        path.style.stroke = color
        path.style.fill = ring === 0 ? color : 'none'
      })
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [rings, reducedMotion])

  const initialColor = moodColor(valence)

  return (
    <svg viewBox="0 0 300 300" aria-hidden className={cn('overflow-visible', className)}>
      {Array.from({ length: rings }, (_, ring) => (
        <path
          key={ring}
          ref={(element) => {
            paths.current[ring] = element
          }}
          d={contourPath(ring, { rings, valence, time: 0 })}
          style={{ stroke: initialColor, fill: ring === 0 ? initialColor : 'none' }}
          strokeOpacity={ringOpacity(ring, rings)}
          fillOpacity={ring === 0 ? 0.16 : 0}
          strokeWidth={ring === 0 ? 1.6 : 1.15}
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  )
}
