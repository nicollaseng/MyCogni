import type { Assessment } from '@mycogni/contracts'
import type { ReactNode } from 'react'
import { instrumentIds, instruments } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { formatLongDate } from '@/shared/lib/time'
import type { LatestResults } from '../latest'

interface LatestScreeningProps {
  results: LatestResults
  timeZone: string
  children?: ReactNode
}

function Row({ assessment }: { assessment: Assessment }) {
  const t = useTranslations('screening')
  return (
    <li className="space-y-1.5">
      <p className="text-sm text-muted-foreground">
        {t(`topics.${assessment.instrument}`)}
        <span className="block sm:inline">
          <span className="hidden sm:inline"> · </span>
          {instruments[assessment.instrument].name}
        </span>
      </p>
      <p className="flex items-baseline gap-1.5">
        <span className="font-serif text-[32px] leading-none">{assessment.totalScore}</span>
        <span className="text-sm text-muted-foreground">
          {t('score.outOf', { max: assessment.maxScore })}
        </span>
      </p>
      <p>{t(`severity.${assessment.severity}`)}</p>
    </li>
  )
}

export function LatestScreening({ results, timeZone, children }: LatestScreeningProps) {
  const t = useTranslations('screening.latest')
  const locale = useLocale()
  const answered = instrumentIds.flatMap((id) => {
    const result = results[id]
    return result === undefined ? [] : [result]
  })
  const latest = answered.reduce<Assessment | undefined>(
    (newest, result) =>
      newest === undefined || result.completedAt > newest.completedAt ? result : newest,
    undefined,
  )

  return (
    <Section title={t('title')}>
      {latest === undefined ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 pt-1">
            {answered.map((assessment) => (
              <Row key={assessment.id} assessment={assessment} />
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {t('answeredOn', {
              date: formatLongDate(new Date(latest.completedAt), timeZone, locale),
            })}
          </p>
        </>
      )}
      {children}
    </Section>
  )
}
