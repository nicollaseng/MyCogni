'use client'

import type { ActivityDay } from '@mycogni/contracts'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { axisLabelIndices, niceTicks, percentOf } from '../chart-scale'
import { formatDayKey, formatDayKeyLong } from '../dates'
import { ChartFrame, type AxisLabel, type AxisTick } from './chart-frame'
import { ChartTable, Columns, MoodLine } from './chart-marks'
import { SegmentedControl } from './filter-controls'
import { MoodDot } from './patient-cells'

const views = ['checkIns', 'mood'] as const

type View = (typeof views)[number]

export function ActivityChart({ activity }: { activity: readonly ActivityDay[] }) {
  const t = useTranslations('professional.overview.activity')
  const chart = useTranslations('professional.chart')
  const mood = useTranslations('common.mood')
  const locale = useLocale()
  const format = useFormatter()
  const [view, setView] = useState<View>('checkIns')
  const decimal = (value: number) =>
    format.number(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

  const total = activity.reduce((sum, day) => sum + day.checkIns, 0)
  const scale = niceTicks(Math.max(0, ...activity.map((day) => day.checkIns)))
  const top = scale.at(-1) ?? 1
  const ticks: AxisTick[] =
    view === 'checkIns'
      ? scale.map((value) => ({ offset: percentOf(value, 0, top), label: format.number(value) }))
      : [
          { offset: 100, label: mood('veryGood') },
          { offset: 50, label: mood('neutral') },
          { offset: 0, label: mood('veryBad') },
        ]
  const last = activity.length - 1
  const axisLabels: AxisLabel[] = axisLabelIndices(activity.length, 7).map((index, position) => {
    const day = activity[index]?.day ?? ''
    return {
      index,
      label: index === last ? chart('today') : formatDayKey(day, locale),
      strong: index === last,
      wide: position % 2 === 1,
    }
  })

  return (
    <div className="space-y-3">
      <SegmentedControl
        label={t('view')}
        options={views}
        value={view}
        labelOf={(option) => t(option)}
        onChange={setView}
      />
      {total === 0 ? (
        <p className="py-10 text-center text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          <ChartFrame
            label={view === 'checkIns' ? t('checkInsLabel', { total }) : t('moodLabel')}
            hint={chart('navigate')}
            count={activity.length}
            ticks={ticks}
            axisLabels={axisLabels}
            gutter={view === 'checkIns' ? 'w-9' : 'w-[5.5rem]'}
            marker={view === 'mood' ? last : undefined}
            readout={(index) => {
              const day = activity[index]
              if (day === undefined) {
                return null
              }
              return (
                <span className="flex flex-col gap-0.5">
                  <span className="text-muted-foreground">{formatDayKeyLong(day.day, locale)}</span>
                  <span className="font-medium">{chart('count', { count: day.checkIns })}</span>
                  {day.patients > 0 && <span>{chart('people', { count: day.patients })}</span>}
                  {day.moodAverage === null ? (
                    <span className="text-muted-foreground">{chart('noMood')}</span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <MoodDot value={day.moodAverage} className="size-2" />
                      {chart('moodValue', { value: decimal(day.moodAverage) })}
                    </span>
                  )}
                </span>
              )
            }}
          >
            {(active) =>
              view === 'checkIns' ? (
                <Columns values={activity.map((day) => day.checkIns)} max={top} active={active} />
              ) : (
                <MoodLine values={activity.map((day) => day.moodAverage)} active={active} />
              )
            }
          </ChartFrame>
          <ChartTable
            summary={chart('showTable')}
            headers={[chart('day'), chart('checkIns'), chart('patients'), chart('mood')]}
            rows={activity.map((day) => ({
              key: day.day,
              cells: [
                formatDayKeyLong(day.day, locale),
                format.number(day.checkIns),
                format.number(day.patients),
                day.moodAverage === null ? '—' : decimal(day.moodAverage),
              ],
            }))}
          />
        </>
      )}
    </div>
  )
}
