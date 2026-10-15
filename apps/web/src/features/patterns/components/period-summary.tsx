import type { PeriodSummary as Summary } from '@mycogni/domain'
import { useFormatter, useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { maxMoodLevel, moodColor, nearestMoodKey } from '@/features/mood/mood-levels'
import { Panel, Section } from '@/shared/components/section'

interface FigureProps {
  label: string
  value: ReactNode
  reading: string
}

function Figure({ label, value, reading }: FigureProps) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2.5 text-[28px] leading-tight font-medium tracking-[-0.01em]">
        {value}
      </dd>
      <dd className="text-sm text-pretty">{reading}</dd>
    </div>
  )
}

interface PeriodSummaryProps {
  summary: Summary
  period: number
  recordedDays: number
  streak: number
}

export function PeriodSummary({ summary, period, recordedDays, streak }: PeriodSummaryProps) {
  const t = useTranslations('patterns.summary')
  const mood = useTranslations('common.mood')
  const format = useFormatter()
  const locale = useLocale()
  const decimal = (value: number, sign: 'auto' | 'exceptZero' = 'auto') =>
    format.number(value, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
      signDisplay: sign,
    })
  const { recent, previous, change } = summary

  return (
    <Section title={t('title')}>
      <Panel className="py-5">
        <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-3">
          {recent !== null && (
            <Figure
              label={t('average')}
              value={
                <>
                  <span
                    aria-hidden
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: moodColor(recent / maxMoodLevel) }}
                  />
                  {decimal(recent)}
                </>
              }
              reading={t('near', {
                mood: mood(nearestMoodKey(recent)).toLocaleLowerCase(locale),
              })}
            />
          )}
          {recent !== null && previous !== null && change !== null && (
            <Figure
              label={t('change')}
              value={decimal(recent - previous, 'exceptZero')}
              reading={t(`changeReading.${change}`, { days: period })}
            />
          )}
          <Figure
            label={t('recorded')}
            value={t('recordedValue', { count: recordedDays, days: period })}
            reading={t('streak', { count: streak })}
          />
        </dl>
      </Panel>
    </Section>
  )
}
