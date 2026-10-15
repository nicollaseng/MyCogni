import type { PatientInsight } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { firstSentence, readingAnchor } from '../readings'
import { useReadingPeriod } from '../use-reading-period'

interface ReadingTeaserProps {
  reading: PatientInsight
  timeZone: string
}

export function ReadingTeaser({ reading, timeZone }: ReadingTeaserProps) {
  const t = useTranslations('insights.teaser')
  const locale = useLocale()
  const periodOf = useReadingPeriod(timeZone, 'patient')

  return (
    <Section title={t('title')}>
      <p className="text-sm text-muted-foreground">{periodOf(reading)}</p>
      <p className="max-w-xl font-serif text-[19px] leading-[1.5] text-pretty">
        {firstSentence(reading.content.summary, locale)}
      </p>
      <Link
        href={`/patterns#${readingAnchor(reading.id)}`}
        className="inline-block text-sm underline decoration-1 underline-offset-4"
      >
        {t('open')}
      </Link>
    </Section>
  )
}
