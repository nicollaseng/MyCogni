import { maxMoodLevel } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { formatTime } from '@/shared/lib/time'
import { cn } from '@/shared/lib/utils'
import { formatEntryDate } from '../dates'
import {
  sampleActivity,
  sampleAttention,
  sampleEntries,
  sampleEntryDate,
  sampleKpis,
  sampleMood,
  samplePatient,
} from '../landing-sample'
import { niceTicks } from '../chart-scale'
import { Columns, MoodLine } from './chart-marks'
import { OverviewKpis } from './overview-kpis'
import { AttentionReasons, MoodAverage, MoodLabel, ScreeningScore } from './patient-cells'

const shotTimeZone = 'America/Sao_Paulo'

interface ShotFrameProps {
  title: string
  caption: string
  className?: string
  children: ReactNode
}

function ShotFrame({ title, caption, className, children }: ShotFrameProps) {
  return (
    <figure className={cn('min-w-0', className)}>
      <div
        aria-hidden
        inert
        className="overflow-hidden rounded-[10px] border border-rule bg-background shadow-[0_30px_70px_-30px_rgb(20_40_30/0.35)] select-none"
      >
        <div className="flex items-center gap-3 border-b border-rule bg-surface px-4 py-2.5">
          <span className="font-serif text-[15px] font-medium tracking-[-0.01em]">MyCogniAI</span>
          <span className="text-[12px] text-muted-foreground">{title}</span>
        </div>
        <div className="space-y-5 p-4 sm:p-6">{children}</div>
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  )
}

function ShotHeading({ children }: { children: ReactNode }) {
  return <p className="font-serif text-[17px] leading-tight tracking-[-0.01em]">{children}</p>
}

function Gridlines({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          className="absolute inset-x-0 h-px bg-rule"
          style={{ bottom: `${String((index / (count - 1)) * 100)}%` }}
        />
      ))}
    </>
  )
}

export function OverviewShot() {
  const t = useTranslations('professional')
  const time = useTranslations('professional.time')
  const top = niceTicks(Math.max(...sampleActivity)).at(-1) ?? 1

  return (
    <ShotFrame title={t('overview.title')} caption={t('join.hero.shot')}>
      <OverviewKpis kpis={sampleKpis} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-2.5">
          <ShotHeading>{t('overview.attention.title')}</ShotHeading>
          <ul className="rounded-[8px] bg-surface">
            {sampleAttention.map((patient) => (
              <li
                key={patient.name}
                className="grid gap-x-4 gap-y-1 px-4 py-2.5 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-baseline"
              >
                <span className="text-[14px] font-medium">{patient.name}</span>
                <AttentionReasons reasons={patient.reasons} />
                <span className="text-[13px] text-muted-foreground max-sm:hidden">
                  {patient.lastSeenDays === 0
                    ? time('hours', { count: 2 })
                    : time('days', { count: patient.lastSeenDays })}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2.5">
          <ShotHeading>{t('overview.activity.checkIns')}</ShotHeading>
          <div className="relative h-24 rounded-[8px] bg-surface px-3 pt-3 pb-2 sm:h-28 lg:h-[8.6rem]">
            <div className="relative h-full">
              <Gridlines count={3} />
              <Columns values={sampleActivity} max={top} active={null} />
            </div>
          </div>
        </div>
      </div>
    </ShotFrame>
  )
}

export function PatientShot() {
  const t = useTranslations('professional')
  const mood = useTranslations('common.mood')
  const locale = useLocale()
  const labels = useCatalogLabels()
  const now = new Date()
  const patient = samplePatient(now)
  const [phq9] = patient.screenings

  return (
    <ShotFrame title={t('patient.kicker')} caption={t('join.features.shot')}>
      <div className="space-y-2">
        <p className="font-serif text-[24px] leading-tight tracking-[-0.015em]">{patient.name}</p>
        <AttentionReasons reasons={patient.attention} />
      </div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <dt className="text-[12px] text-muted-foreground">{t('patient.kpis.mood')}</dt>
          <dd>
            <MoodAverage average={patient.moodAverage} previous={patient.previousMoodAverage} />
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-[12px] text-muted-foreground">{t('patient.kpis.checkIns')}</dt>
          <dd className="font-medium">{patient.checkInsLast30Days}</dd>
        </div>
        <div className="space-y-1 max-sm:hidden">
          <dt className="text-[12px] text-muted-foreground">{t('patient.kpis.phq9')}</dt>
          <dd>
            <ScreeningScore screening={phq9} />
          </dd>
        </div>
      </dl>
      <div className="flex gap-3 rounded-[8px] bg-surface px-3 py-3">
        <div className="relative w-[4.25rem] shrink-0 text-[11px] text-muted-foreground">
          <span className="absolute top-0 right-0 -translate-y-1/2">{mood('veryGood')}</span>
          <span className="absolute top-1/2 right-0 -translate-y-1/2">{mood('neutral')}</span>
          <span className="absolute right-0 bottom-0 translate-y-1/2">{mood('veryBad')}</span>
        </div>
        <div className="relative h-28 flex-1 sm:h-32">
          <Gridlines count={3} />
          <MoodLine
            values={sampleMood.map((value) =>
              value === null ? null : Math.min(maxMoodLevel, value),
            )}
            active={null}
          />
        </div>
      </div>
      <ul className="space-y-0.5 rounded-[8px] bg-surface py-1">
        {sampleEntries.map((entry) => {
          const date = sampleEntryDate(entry, now)
          return (
            <li
              key={entry.daysAgo}
              className="grid gap-x-4 gap-y-0.5 px-3 py-2 text-[13px] sm:grid-cols-[9.5rem_8rem_minmax(0,1fr)]"
            >
              <span className="text-muted-foreground">
                {formatEntryDate(date, shotTimeZone, locale)} ·{' '}
                {formatTime(date, shotTimeZone, locale)}
              </span>
              <MoodLabel level={entry.moodLevel} />
              <span className="truncate font-serif text-[14px]">
                {entry.note === null
                  ? entry.emotions.map(labels.emotion).join(', ')
                  : t(`join.sample.${entry.note}`)}
              </span>
            </li>
          )
        })}
      </ul>
    </ShotFrame>
  )
}

export function SummaryShot() {
  const t = useTranslations('professional.join.summaries.sample')
  return (
    <figure className="min-w-0">
      <div className="rounded-[10px] border border-rule bg-background p-5 shadow-[0_30px_70px_-30px_rgb(20_40_30/0.3)] sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
          <p className="text-[13px] font-medium tracking-[0.02em] text-muted-foreground uppercase">
            {t('label')}
          </p>
          <p className="text-[13px] text-muted-foreground">{t('period')}</p>
        </div>
        <div className="space-y-3 pt-4 font-serif text-[17px] leading-relaxed text-pretty">
          <p>{t('first')}</p>
          <p>{t('second')}</p>
          <p className="text-muted-foreground">{t('question')}</p>
        </div>
        <p className="mt-5 text-[12px] text-muted-foreground">{t('note')}</p>
      </div>
      <figcaption className="sr-only">{t('caption')}</figcaption>
    </figure>
  )
}
