import type { Assessment } from '@mycogni/contracts'
import type { ReactNode } from 'react'
import { instrumentIds, instruments } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'
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
    <li className="py-3.5">
      <p className="text-sm text-muted-foreground">
        {t(`topics.${assessment.instrument}`)}
        <span className="whitespace-nowrap"> · {instruments[assessment.instrument].name}</span>
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="font-serif text-[28px] leading-none">{assessment.totalScore}</span>
        <span className="text-sm text-muted-foreground">
          {t('score.outOf', { max: assessment.maxScore })}
        </span>
        <span className="ml-auto text-right">{t(`severity.${assessment.severity}`)}</span>
      </p>
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
        <Panel>
          <p className="py-3.5 text-muted-foreground">{t('empty')}</p>
        </Panel>
      ) : (
        <>
          <Panel>
            <ul>
              {answered.map((assessment) => (
                <Row key={assessment.id} assessment={assessment} />
              ))}
            </ul>
          </Panel>
          <p className="px-1 text-sm text-muted-foreground">
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
