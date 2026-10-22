'use client'

import type { CSSProperties } from 'react'
import { contourPath, ringOpacity } from '@/features/mood/contour'
import { cn } from '@/shared/lib/utils'
import { phaseMs, roundMs, type BreathingStatus } from '../breathing'
import { useContourDrift, type ContourShape } from '../use-contour-drift'

interface BreathingReliefProps {
  status: BreathingStatus
  run: number
  word: string | null
  count: number | null
  reducedMotion: boolean
}

const shape: ContourShape = { rings: 7, valence: 0.8, base: 70, gap: 11.5 }

const sweepRing = 2

const driftSpeed = 0.22

function restingPose(status: BreathingStatus, reducedMotion: boolean): string {
  if (status === 'idle' && !reducedMotion) {
    return 'animate-relief-idle'
  }
  return status === 'finished' ? 'scale-[0.94]' : 'scale-[0.9]'
}

export function BreathingRelief({ status, run, word, count, reducedMotion }: BreathingReliefProps) {
  const active = status === 'running' || status === 'paused'
  const moving = active && !reducedMotion
  const track = useContourDrift(shape, !reducedMotion, driftSpeed)
  const playState = status === 'paused' ? 'paused' : 'running'
  const breath: CSSProperties = {
    animationDuration: `${String(roundMs)}ms`,
    animationPlayState: playState,
  }
  const sweep: CSSProperties = {
    animationDuration: `${String(phaseMs)}ms`,
    animationPlayState: playState,
  }
  const rings = shape.rings

  return (
    <div
      className="relative size-[300px] shrink-0 sm:size-[440px]"
      data-testid="breathing-relief"
      data-status={status}
    >
      <svg
        aria-hidden
        viewBox="0 0 300 300"
        className="absolute inset-0 size-full overflow-visible"
      >
        <g
          key={moving ? `breath-${String(run)}` : status}
          data-testid="relief-rings"
          className={cn(
            'origin-center [transform-box:view-box] motion-reduce:animate-none',
            moving ? 'animate-relief-breath' : restingPose(status, reducedMotion),
          )}
          style={moving ? breath : undefined}
        >
          {Array.from({ length: rings }, (_, ring) => (
            <path
              key={ring}
              ref={track(ring)}
              data-testid={ring === 0 ? 'relief-centre' : undefined}
              d={contourPath(ring, { ...shape, time: 0 })}
              fill={ring === 0 ? 'var(--zen-foreground)' : 'none'}
              fillOpacity={ring === 0 ? (status === 'finished' ? 0.13 : 0.07) : undefined}
              className={ring === 0 && moving ? 'animate-relief-fill' : undefined}
              style={ring === 0 && moving ? breath : undefined}
              stroke="var(--zen-foreground)"
              strokeOpacity={ringOpacity(ring, rings) * 0.55}
              strokeWidth={ring === 0 ? 1.4 : 1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {moving && (
            <path
              ref={track(sweepRing)}
              data-testid="relief-sweep"
              d={contourPath(sweepRing, { ...shape, time: 0 })}
              pathLength={1}
              strokeDasharray="1"
              fill="none"
              stroke="var(--zen-foreground)"
              strokeWidth={1.3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-relief-sweep motion-reduce:hidden"
              style={sweep}
            />
          )}
        </g>
      </svg>
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3 text-center transition-opacity duration-300 motion-reduce:transition-none',
          status === 'paused' && 'opacity-60',
        )}
      >
        {word !== null && (
          <p className="font-serif text-[36px] leading-none tracking-[-0.02em] sm:text-[48px]">
            {word}
          </p>
        )}
        {count !== null && (
          <p
            aria-hidden
            data-testid="breathing-count"
            className="text-[15px] text-zen-foreground/70 tabular-nums"
          >
            {count}
          </p>
        )}
      </div>
    </div>
  )
}
