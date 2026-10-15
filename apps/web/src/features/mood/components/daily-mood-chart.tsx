'use client'

import type { MoodDay } from '@mycogni/domain'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { dateOfDay, formatLongDate } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { isDense, labeledSlots, linePaths, moodTop, slotCenter } from '../chart-geometry'
import { maxMoodLevel, moodColor, nearestMoodKey } from '../mood-levels'

interface DailyMoodChartProps {
  days: readonly MoodDay[]
  label: string
}

const gridLevels = [maxMoodLevel, maxMoodLevel / 2, 0] as const

function dotSize(index: number, lastIndex: number, slots: number): string {
  if (index === lastIndex) {
    return isDense(slots) ? 'size-3.5' : 'size-2.5'
  }
  if (isDense(slots)) {
    return 'size-2.5'
  }
  return slots > 45 ? 'size-1.5' : 'size-2'
}

function tooltipAlign(index: number, slots: number): string {
  const share = (index + 0.5) / slots
  if (share < 1 / 3) {
    return '-ml-3'
  }
  return share > 2 / 3 ? 'ml-3 -translate-x-full' : '-translate-x-1/2'
}

export function DailyMoodChart({ days, label }: DailyMoodChartProps) {
  const t = useTranslations('today.chart')
  const mood = useTranslations('common.mood')
  const format = useFormatter()
  const locale = useLocale()
  const tooltipId = useId()
  const [active, setActive] = useState<number | null>(null)
  const slots = days.length
  const lastIndex = slots - 1
  const averageText = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const dayName = (day: string) =>
    new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(dateOfDay(day))
  const activeDay = active === null ? undefined : days[active]
  const shortDay = (day: string) =>
    new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
      dateOfDay(day),
    )

  function pick(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    if (box.width <= 0) {
      return
    }
    const share = (event.clientX - box.left) / box.width
    setActive(Math.min(lastIndex, Math.max(0, Math.floor(share * slots))))
  }

  function step(event: KeyboardEvent<HTMLDivElement>) {
    const moves: Partial<Record<string, number>> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      Home: -slots,
      End: slots,
    }
    const move = moves[event.key]
    if (move === undefined) {
      return
    }
    event.preventDefault()
    setActive(Math.min(lastIndex, Math.max(0, (active ?? lastIndex) + move)))
  }

  return (
    <figure className="space-y-2">
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3">
        <div
          aria-hidden
          className="flex h-44 flex-col justify-between text-xs leading-4 text-muted-foreground"
        >
          <span>{mood('veryGood')}</span>
          <span>{mood('neutral')}</span>
          <span>{mood('veryBad')}</span>
        </div>
        <div
          role="group"
          tabIndex={0}
          aria-label={label}
          aria-describedby={tooltipId}
          onPointerMove={pick}
          onPointerDown={pick}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') {
              setActive(null)
            }
          }}
          onFocus={() => {
            setActive(active ?? lastIndex)
          }}
          onBlur={() => {
            setActive(null)
          }}
          onKeyDown={step}
          className="relative h-44 touch-pan-y rounded-sm outline-offset-4"
        >
          <div
            aria-hidden
            className="absolute inset-y-0 rounded-sm bg-foreground/[0.04]"
            style={{
              left: `${String((lastIndex / slots) * 100)}%`,
              width: `${String(100 / slots)}%`,
            }}
          />
          {gridLevels.map((level) => (
            <div
              key={level}
              aria-hidden
              className="absolute inset-x-0 h-px bg-rule"
              style={{ top: moodTop(level) }}
            />
          ))}
          {activeDay !== undefined && active !== null && (
            <div
              aria-hidden
              className="absolute inset-y-0 w-px bg-foreground/30"
              style={{ left: slotCenter(active, slots) }}
            />
          )}
          <svg
            aria-hidden
            viewBox={`0 0 ${String(slots)} ${String(maxMoodLevel)}`}
            preserveAspectRatio="none"
            className="absolute inset-x-0 top-2 bottom-2 h-[calc(100%-16px)] w-full overflow-visible"
          >
            {linePaths(days.map((day) => day.average)).map((path) => (
              <path
                key={path}
                d={path}
                fill="none"
                stroke="var(--muted-foreground)"
                strokeOpacity={0.5}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {days.map((day, index) =>
            day.average === null ? null : (
              <span
                key={day.day}
                aria-hidden
                data-day={day.day}
                className={cn(
                  'absolute -translate-1/2 rounded-full ring-2 ring-background',
                  dotSize(index, lastIndex, slots),
                  index === active && 'ring-foreground/40',
                )}
                style={{
                  left: slotCenter(index, slots),
                  top: moodTop(day.average),
                  backgroundColor: moodColor(day.average / maxMoodLevel),
                }}
              />
            ),
          )}
          <div
            id={tooltipId}
            aria-live="polite"
            className={cn(
              'pointer-events-none absolute bottom-full z-10 mb-2 rounded-md border border-rule bg-background px-2.5 py-1.5 text-xs leading-snug whitespace-nowrap',
              activeDay === undefined || active === null ? 'sr-only' : tooltipAlign(active, slots),
            )}
            style={active === null ? undefined : { left: slotCenter(active, slots) }}
          >
            {activeDay !== undefined && (
              <>
                <span className="block text-muted-foreground">{dayName(activeDay.day)}</span>
                {activeDay.average === null ? (
                  <span className="block">{t('noRecord')}</span>
                ) : (
                  <>
                    <span className="block">
                      <span className="font-medium">{averageText(activeDay.average)}</span>{' '}
                      {mood(nearestMoodKey(activeDay.average))}
                    </span>
                    <span className="block text-muted-foreground">
                      {t('records', { count: activeDay.count })}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div />
        {isDense(slots) ? (
          <div
            aria-hidden
            className="grid text-center text-[11px] leading-5 text-muted-foreground"
            style={{ gridTemplateColumns: `repeat(${String(slots)}, minmax(0, 1fr))` }}
          >
            {days.map((day, index) => (
              <span
                key={day.day}
                className={cn(index === lastIndex && 'font-medium text-foreground')}
              >
                {Number(day.day.slice(8))}
              </span>
            ))}
          </div>
        ) : (
          <div aria-hidden className="relative h-5 text-[11px] leading-5 text-muted-foreground">
            {labeledSlots(slots).map((index) => (
              <span
                key={index}
                className={cn(
                  'absolute top-0 whitespace-nowrap',
                  index === lastIndex
                    ? '-translate-x-full font-medium text-foreground'
                    : '-translate-x-1/2',
                )}
                style={{ left: index === lastIndex ? '100%' : slotCenter(index, slots) }}
              >
                {shortDay(days[index]?.day ?? '')}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="sr-only">
        <table>
          <caption>{label}</caption>
          <thead>
            <tr>
              <th scope="col">{t('day')}</th>
              <th scope="col">{t('mood')}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day.day}>
                <th scope="row">{formatLongDate(dateOfDay(day.day), 'UTC', locale)}</th>
                <td>
                  {day.average === null
                    ? t('noRecord')
                    : `${averageText(day.average)} · ${mood(nearestMoodKey(day.average))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  )
}
