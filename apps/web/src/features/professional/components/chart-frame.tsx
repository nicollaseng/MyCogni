'use client'

import { useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { bandCenter, indexAt, movedIndex, tooltipSide } from '../chart-scale'

export interface AxisTick {
  offset: number
  label: string
}

export interface AxisLabel {
  index: number
  label: string
  strong?: boolean
  wide?: boolean
}

interface ChartFrameProps {
  label: string
  hint: string
  count: number
  ticks: readonly AxisTick[]
  axisLabels: readonly AxisLabel[]
  gutter: string
  marker?: number
  readout: (index: number) => ReactNode
  children: (active: number | null) => ReactNode
}

const sideStyles = {
  right: 'ml-3',
  left: '-translate-x-full -ml-3',
} as const

export function ChartFrame({
  label,
  hint,
  count,
  ticks,
  axisLabels,
  gutter,
  marker,
  readout,
  children,
}: ChartFrameProps) {
  const [active, setActive] = useState<number | null>(null)

  function handlePointer(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    setActive(indexAt(event.clientX - box.left, box.width, count))
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      setActive(null)
      return
    }
    const next = movedIndex(active, event.key, count)
    if (next !== active) {
      event.preventDefault()
      setActive(next)
    }
  }

  return (
    <div className="flex select-none">
      <div aria-hidden className={cn('relative shrink-0', gutter)}>
        <div className="absolute inset-x-0 top-3 bottom-9">
          {ticks.map((tick) => (
            <span
              key={tick.offset}
              className="absolute right-3 translate-y-1/2 text-xs leading-none whitespace-nowrap text-muted-foreground tabular-nums"
              style={{ bottom: `${String(tick.offset)}%` }}
            >
              {tick.label}
            </span>
          ))}
        </div>
      </div>
      <div className="relative min-w-0 flex-1">
        <div
          role="group"
          tabIndex={0}
          aria-label={label}
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => {
            setActive(null)
          }}
          onKeyDown={handleKey}
          onBlur={() => {
            setActive(null)
          }}
          className="relative mt-3 h-44 rounded-[6px] outline-offset-4 sm:h-52 xl:h-72"
        >
          <span className="sr-only">{hint}</span>
          <div aria-hidden className="absolute inset-0">
            {ticks.map((tick) => (
              <span
                key={tick.offset}
                className="absolute inset-x-0 h-px bg-rule"
                style={{ bottom: `${String(tick.offset)}%` }}
              />
            ))}
            {marker !== undefined && (
              <span
                className="absolute inset-y-0 w-px -translate-x-1/2 bg-foreground/15"
                style={{ left: `${String(bandCenter(marker, count))}%` }}
              />
            )}
            {active !== null && (
              <span
                className="absolute inset-y-0 w-px -translate-x-1/2 bg-foreground/40"
                style={{ left: `${String(bandCenter(active, count))}%` }}
              />
            )}
          </div>
          <div aria-hidden className="absolute inset-0">
            {children(active)}
          </div>
          {active !== null && (
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute top-0 z-10 w-max max-w-56 rounded-[6px] bg-background px-3 py-2 text-sm shadow-[0_1px_2px_rgb(0_0_0/0.06),0_6px_20px_rgb(0_0_0/0.08)] ring-1 ring-rule',
                sideStyles[tooltipSide(active, count)],
              )}
              style={{ left: `${String(bandCenter(active, count))}%` }}
            >
              {readout(active)}
            </div>
          )}
          <div role="status" className="sr-only">
            {active === null ? '' : readout(active)}
          </div>
        </div>
        <div aria-hidden className="relative h-9">
          {axisLabels.map((axis) => (
            <span
              key={axis.index}
              className={cn(
                'absolute top-2.5 -translate-x-1/2 text-xs whitespace-nowrap text-muted-foreground',
                axis.strong === true && 'font-medium text-foreground',
                axis.wide === true && 'max-sm:hidden',
              )}
              style={{ left: `${String(bandCenter(axis.index, count))}%` }}
            >
              {axis.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
