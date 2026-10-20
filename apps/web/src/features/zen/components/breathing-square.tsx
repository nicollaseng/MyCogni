import type { CSSProperties } from 'react'
import { cn } from '@/shared/lib/utils'
import { roundMs, type BreathingStatus } from '../breathing'

interface BreathingSquareProps {
  status: BreathingStatus
  run: number
  word: string | null
  count: number | null
  reducedMotion: boolean
}

export function BreathingSquare({ status, run, word, count, reducedMotion }: BreathingSquareProps) {
  const active = status === 'running' || status === 'paused'
  const moving = active && !reducedMotion
  const timing: CSSProperties = {
    animationDuration: `${String(roundMs)}ms`,
    animationPlayState: status === 'paused' ? 'paused' : 'running',
  }
  const fill = moving
    ? 'animate-box-fill'
    : status !== 'idle'
      ? undefined
      : reducedMotion
        ? 'scale-[0.68]'
        : 'animate-box-idle'

  return (
    <div
      className="relative size-[260px] shrink-0 sm:size-[360px]"
      data-testid="breathing-square"
      data-status={status}
    >
      <span
        key={moving ? `fill-${String(run)}` : status}
        aria-hidden
        data-testid="breathing-fill"
        className={cn(
          'absolute inset-[12%] rounded-md bg-zen-line/25 motion-reduce:animate-none',
          fill,
        )}
        style={moving ? timing : undefined}
      />
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full overflow-visible"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="none"
          stroke="var(--zen-foreground)"
          strokeOpacity={0.24}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {moving && (
          <path
            key={run}
            data-testid="breathing-trail"
            d="M0 100V0H100V100Z"
            pathLength={4}
            strokeDasharray="4"
            fill="none"
            stroke="var(--zen-foreground)"
            strokeWidth={0.75}
            strokeLinejoin="miter"
            className="animate-box-trail motion-reduce:animate-none"
            style={timing}
          />
        )}
      </svg>
      {moving && (
        <span
          key={`dot-${String(run)}`}
          aria-hidden
          data-testid="breathing-dot"
          className="absolute inset-0 animate-box-dot motion-reduce:hidden"
          style={timing}
        >
          <span className="absolute top-0 left-0 size-3.5 -translate-1/2 rounded-full bg-zen-foreground" />
        </span>
      )}
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
