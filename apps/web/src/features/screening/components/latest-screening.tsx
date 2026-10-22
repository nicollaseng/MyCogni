import { screeningDomains, type ScreeningDomain } from '@mycogni/domain'
import type { ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { formatLongDate } from '@/shared/lib/time'
import type { PlainResult } from '../latest'
import { PlainScale } from './plain-scale'

interface LatestScreeningProps {
  results: Partial<Record<ScreeningDomain, PlainResult>>
  timeZone: string
  children?: ReactNode
}

function Row({ result }: { result: PlainResult }) {
  const t = useTranslations('screening.plain')
  return (
    <li className="space-y-1.5">
      <p className="text-sm text-muted-foreground">{t(`names.${result.domain}`)}</p>
      <p className="font-serif text-[28px] leading-none">{t(`levels.${result.level}`)}</p>
      <PlainScale level={result.level} className="max-w-40 pt-1" />
      {result.trend !== null && <p className="text-sm">{t(`trend.${result.trend}`)}</p>}
    </li>
  )
}

export function LatestScreening({ results, timeZone, children }: LatestScreeningProps) {
  const t = useTranslations('screening.latest')
  const locale = useLocale()
  const answered = screeningDomains.flatMap((domain) => {
    const result = results[domain]
    return result === undefined ? [] : [result]
  })
  const latest = answered.reduce<PlainResult | undefined>(
    (newest, result) =>
      newest === undefined || result.assessment.completedAt > newest.assessment.completedAt
        ? result
        : newest,
    undefined,
  )

  return (
    <Section title={t('title')}>
      {latest === undefined ? (
        <p className="text-muted-foreground">{t('empty')}</p>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-5 pt-1">
            {answered.map((result) => (
              <Row key={result.assessment.id} result={result} />
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {t('answeredOn', {
              date: formatLongDate(new Date(latest.assessment.completedAt), timeZone, locale),
            })}
          </p>
        </>
      )}
      {children}
    </Section>
  )
}
