import type { PlainQuestionnaireSummaryView } from '@mycogni/contracts'
import { crisisLinesFor } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { PlainScale } from '@/features/screening/components/plain-scale'

function CrisisLines() {
  const t = useTranslations('questionnaires.summary')
  const lines = crisisLinesFor(useLocale())
  return (
    <div className="space-y-1 border-l-2 border-help pl-4 text-sm leading-relaxed">
      <p>{t('lines')}</p>
      {lines.map((line) => (
        <p key={line.phone}>
          <a
            href={`tel:${line.phone}`}
            className="font-medium underline decoration-1 underline-offset-4"
          >
            {line.display}
          </a>{' '}
          <span className="text-muted-foreground">{line.description}</span>
        </p>
      ))}
    </div>
  )
}

export function PlainSummary({ summary }: { summary: PlainQuestionnaireSummaryView }) {
  const t = useTranslations('questionnaires')
  const name = t(`names.${summary.area}`)

  if (summary.safety) {
    return (
      <section aria-label={name} className="space-y-5">
        <h2 className="text-sm text-muted-foreground">{name}</h2>
        <p className="font-serif text-[22px] leading-[1.35] text-pretty">{t('summary.safety')}</p>
        <CrisisLines />
      </section>
    )
  }

  return (
    <section aria-label={name}>
      <h2 className="text-sm text-muted-foreground">{name}</h2>
      <p className="mt-2 font-serif text-[34px] leading-none tracking-[-0.02em]">
        {t(`levels.${summary.level}`)}
      </p>
      <PlainScale level={summary.level} className="mt-4 max-w-60" />
      <p className="mt-4 text-[15px] leading-relaxed text-pretty">
        {t(`summary.sentences.${summary.area}.${summary.level}`)}
      </p>
    </section>
  )
}
