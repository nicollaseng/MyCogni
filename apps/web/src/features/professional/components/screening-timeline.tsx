import type { Assessment } from '@mycogni/contracts'
import { instrumentIds, instruments, type InstrumentId } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'
import { formatShortDate } from '../dates'

const shownPerInstrument = 8

interface ScreeningTimelineProps {
  assessments: readonly Assessment[]
  timeZone: string
}

function InstrumentHistory({
  instrument,
  assessments,
  timeZone,
}: {
  instrument: InstrumentId
  assessments: readonly Assessment[]
  timeZone: string
}) {
  const t = useTranslations('professional')
  const screening = useTranslations('screening')
  const locale = useLocale()
  const titleId = `screening-${instrument}`

  return (
    <Panel className="py-4">
      <h3 id={titleId} className="pt-1 pb-2 text-sm text-muted-foreground">
        {instruments[instrument].name} · {screening(`topics.${instrument}`)}
      </h3>
      {assessments.length === 0 ? (
        <p className="py-2 text-muted-foreground">{t('patients.notAnswered')}</p>
      ) : (
        <ul aria-labelledby={titleId}>
          {assessments.slice(0, shownPerInstrument).map((assessment) => (
            <li key={assessment.id} className="flex items-baseline justify-between gap-4 py-2">
              <span>{formatShortDate(new Date(assessment.completedAt), timeZone, locale)}</span>
              <span className="text-right">
                {screening(`severity.${assessment.severity}`)}
                <span className="text-sm whitespace-nowrap text-muted-foreground">
                  {' · '}
                  {t('patient.screenings.score', {
                    score: assessment.totalScore,
                    max: assessment.maxScore,
                  })}
                </span>
                {assessment.hasRiskFlag && (
                  <span className="block text-sm font-medium text-danger">{t('risk.short')}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

export function ScreeningTimeline({ assessments, timeZone }: ScreeningTimelineProps) {
  const t = useTranslations('professional.patient.screenings')
  const ordered = [...assessments].sort((first, second) =>
    second.completedAt.localeCompare(first.completedAt),
  )

  return (
    <Section title={t('title')}>
      {ordered.length === 0 ? (
        <Panel>
          <p className="py-3.5 text-muted-foreground">{t('empty')}</p>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {instrumentIds.map((instrument) => (
            <InstrumentHistory
              key={instrument}
              instrument={instrument}
              assessments={ordered.filter((assessment) => assessment.instrument === instrument)}
              timeZone={timeZone}
            />
          ))}
        </div>
      )}
      <p className="px-1 text-sm text-muted-foreground">{t('note')}</p>
    </Section>
  )
}
