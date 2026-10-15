import type { PatientInsight } from '@mycogni/contracts'
import { insightCheckInThreshold } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { cn } from '@/shared/lib/utils'
import { readingAnchor } from '../readings'
import { useReadingPeriod } from '../use-reading-period'
import { EarlierReadings } from './earlier-readings'
import { ReadingContent } from './reading-content'

export interface ReadingsProgress {
  enabled: boolean
  recorded: number
}

function EmptyReadings({ enabled, recorded }: ReadingsProgress) {
  const t = useTranslations('insights.patient.empty')
  const threshold = insightCheckInThreshold

  return (
    <div className="space-y-4">
      <p className="max-w-xl leading-relaxed text-pretty text-muted-foreground">
        {t('explanation', { threshold })}
      </p>
      {!enabled ? (
        <p className="text-pretty">
          {t('disabled')}{' '}
          <Link href="/me" className="underline decoration-1 underline-offset-4">
            {t('enable')}
          </Link>
        </p>
      ) : (
        recorded < threshold && (
          <div className="max-w-xs space-y-2">
            <p className="text-sm tabular-nums">{t('progress', { count: recorded, threshold })}</p>
            <div
              aria-hidden
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: `repeat(${String(threshold)}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: threshold }, (_, index) => (
                <span
                  key={index}
                  data-filled={index < recorded}
                  className={cn(
                    'h-1.5 rounded-xs',
                    index < recorded ? 'bg-emphasis' : 'bg-foreground/10',
                  )}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  )
}

interface PatientReadingsProps {
  readings: readonly PatientInsight[]
  progress: ReadingsProgress
  timeZone: string
}

export function PatientReadings({ readings, progress, timeZone }: PatientReadingsProps) {
  const t = useTranslations('insights.patient')
  const periodOf = useReadingPeriod(timeZone, 'patient')
  const [latest, ...earlier] = readings

  return (
    <Section title={t('title')}>
      {latest === undefined ? (
        <EmptyReadings {...progress} />
      ) : (
        <>
          <article id={readingAnchor(latest.id)} className="scroll-mt-6 space-y-5">
            <p className="text-sm text-muted-foreground">
              {t('period', { period: periodOf(latest), count: latest.checkInCount })}
            </p>
            <ReadingContent content={latest.content} prominent />
          </article>
          <p className="pt-2 text-sm text-pretty text-muted-foreground">{t('disclaimer')}</p>
          {earlier.length > 0 && (
            <EarlierReadings
              readings={earlier.map((reading) => ({ reading, period: periodOf(reading) }))}
            />
          )}
        </>
      )}
    </Section>
  )
}
