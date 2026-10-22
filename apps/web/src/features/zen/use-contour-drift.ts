'use client'

import { useEffect, useRef } from 'react'
import { contourPath, type ContourOptions } from '@/features/mood/contour'

export type ContourShape = Omit<ContourOptions, 'time'>

const frameMs = 60

export function useContourDrift(
  { rings, valence, base, gap }: ContourShape,
  moving: boolean,
  speed: number,
): (ring: number) => (element: SVGPathElement | null) => () => void {
  const elements = useRef(new Map<SVGPathElement, number>())

  useEffect(() => {
    if (!moving) {
      return undefined
    }
    let frame = 0
    let last = 0
    const render = (now: number) => {
      if (now - last >= frameMs) {
        last = now
        const time = (now / 1000) * speed
        elements.current.forEach((ring, path) => {
          path.setAttribute('d', contourPath(ring, { rings, valence, time, base, gap }))
        })
      }
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(frame)
    }
  }, [moving, rings, valence, base, gap, speed])

  return (ring) => (element) => {
    if (element !== null) {
      elements.current.set(element, ring)
    }
    return () => {
      if (element !== null) {
        elements.current.delete(element)
      }
    }
  }
}
