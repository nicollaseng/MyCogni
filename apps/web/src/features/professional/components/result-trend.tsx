'use client'

import type { AssignmentDetail } from '@mycogni/contracts'
import { questionnaireForms, scoreRange, type QuestionnaireVariant } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { bandCenter, percentOf } from '../chart-scale'
import { formatShortDate } from '../dates'
import { ChartFrame } from './chart-frame'
import { ChartTable } from './chart-marks'

interface ResultTrendProps {
  variant: QuestionnaireVariant
  trend: AssignmentDetail['trend']
  current: string
  timeZone: string
}

function ScoreLine({
  totals,
  min,
  max,
  current,
  active,
}: {
  totals: readonly number[]
  min: number
  max: number
  current: number
  active: number | null
}) {
  const count = totals.length
  const y = (value: number) => 100 - percentOf(value, min, max)
  return (
    <>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 size-full overflow-visible text-muted-foreground"
      >
        <polyline
          points={totals
            .map((total, index) => `${String(bandCenter(index, count))},${String(y(total))}`)
            .join(' ')}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {totals.map((total, index) => (
        <span
          key={index}
          className={cn(
            'absolute size-[9px] -translate-x-1/2 translate-y-1/2 rounded-full bg-muted-foreground ring-2 ring-surface',
            index === current && 'bg-foreground',
            active === index && 'size-[13px]',
          )}
          style={{
            left: `${String(bandCenter(index, count))}%`,
            bottom: `${String(percentOf(total, min, max))}%`,
          }}
        />
      ))}
    </>
  )
}

export function ResultTrend({ variant, trend, current, timeZone }: ResultTrendProps) {
  const t = useTranslations('assignments')
  const chart = useTranslations('professional.chart')
  const locale = useLocale()
  const { min, max } = scoreRange(variant)
  const date = (value: string) => formatShortDate(new Date(value), timeZone, locale)
  const thresholds = questionnaireForms[variant].bands.slice(1).map((band) => band.min)

  if (trend.length < 2) {
    return <p className="text-[15px] text-muted-foreground">{t('result.trendEmpty')}</p>
  }

  return (
    <div className="space-y-1">
      <ChartFrame
        label={t('result.trendLabel')}
        hint={chart('navigate')}
        count={trend.length}
        ticks={[min, ...thresholds, max].map((value) => ({
          offset: percentOf(value, min, max),
          label: String(value),
        }))}
        axisLabels={trend.map((point, index) => ({ index, label: date(point.completedAt) }))}
        gutter="w-10"
        readout={(index) => {
          const point = trend[index]
          return point === undefined ? null : (
            <span className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">{date(point.completedAt)}</span>
              <span className="font-medium tabular-nums">
                {point.total}/{max}
              </span>
              <span>{t(`bands.${point.band}`)}</span>
            </span>
          )
        }}
      >
        {(active) => (
          <ScoreLine
            totals={trend.map((point) => point.total)}
            min={min}
            max={max}
            current={trend.findIndex((point) => point.assignmentId === current)}
            active={active}
          />
        )}
      </ChartFrame>
      <ChartTable
        summary={chart('showTable')}
        headers={[chart('day'), t('result.total'), t('result.band')]}
        rows={trend.map((point) => ({
          key: point.assignmentId,
          cells: [
            date(point.completedAt),
            `${String(point.total)}/${String(max)}`,
            t(`bands.${point.band}`),
          ],
        }))}
      />
    </div>
  )
}
