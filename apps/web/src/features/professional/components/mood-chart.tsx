'use client'

import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { isMoodLevel, moodKeyOf } from '@/features/mood/mood-levels'
import { axisLabelIndices } from '../chart-scale'
import { formatDayKey, formatDayKeyLong } from '../dates'
import type { MoodDay } from '../mood-days'
import { ChartFrame, type AxisLabel } from './chart-frame'
import { ChartTable, MoodLine } from './chart-marks'
import { MoodDot } from './patient-cells'

export function MoodChart({ days }: { days: readonly MoodDay[] }) {
  const t = useTranslations('professional.patient.mood')
  const chart = useTranslations('professional.chart')
  const mood = useTranslations('common.mood')
  const locale = useLocale()
  const format = useFormatter()
  const decimal = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const recorded = days.filter((day) => day.average !== null)
  const last = days.length - 1

  if (recorded.length === 0) {
    return (
      <p className="py-10 text-center text-muted-foreground">{t('empty', { days: days.length })}</p>
    )
  }

  const axisLabels: AxisLabel[] = axisLabelIndices(days.length, 7).map((index, position) => ({
    index,
    label: index === last ? chart('today') : formatDayKey(days[index]?.day ?? '', locale),
    strong: index === last,
    wide: position % 2 === 1,
  }))

  return (
    <div className="space-y-1">
      <ChartFrame
        label={t('label', { days: days.length, count: recorded.length })}
        hint={chart('navigate')}
        count={days.length}
        ticks={[
          { offset: 100, label: mood('veryGood') },
          { offset: 50, label: mood('neutral') },
          { offset: 0, label: mood('veryBad') },
        ]}
        axisLabels={axisLabels}
        gutter="w-[5.5rem]"
        marker={last}
        readout={(index) => {
          const day = days[index]
          if (day === undefined) {
            return null
          }
          const rounded = day.average === null ? null : Math.round(day.average)
          return (
            <span className="flex flex-col gap-0.5">
              <span className="text-muted-foreground">{formatDayKeyLong(day.day, locale)}</span>
              {day.average === null || rounded === null || !isMoodLevel(rounded) ? (
                <span>{chart('count', { count: 0 })}</span>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 font-medium">
                    <MoodDot value={day.average} className="size-2" />
                    {chart('moodValue', { value: decimal(day.average) })}
                  </span>
                  <span>{mood(moodKeyOf(rounded))}</span>
                  <span className="text-muted-foreground">
                    {chart('count', { count: day.count })}
                  </span>
                </>
              )}
            </span>
          )
        }}
      >
        {(active) => <MoodLine values={days.map((day) => day.average)} active={active} />}
      </ChartFrame>
      <ChartTable
        summary={chart('showTable')}
        headers={[chart('day'), chart('mood'), chart('checkIns')]}
        rows={recorded.map((day) => ({
          key: day.day,
          cells: [
            formatDayKeyLong(day.day, locale),
            day.average === null ? '—' : decimal(day.average),
            format.number(day.count),
          ],
        }))}
      />
    </div>
  )
}
