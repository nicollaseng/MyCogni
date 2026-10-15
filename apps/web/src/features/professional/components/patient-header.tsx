import type { PatientSummary } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import { formatDate } from '../dates'
import { latestScreenings } from '../screenings'
import { RiskMarker } from './risk-marker'

interface PatientHeaderProps {
  patient: PatientSummary
  timeZone: string
}

export function PatientHeader({ patient, timeZone }: PatientHeaderProps) {
  const t = useTranslations('professional')
  const locale = useLocale()
  const flagged = latestScreenings(patient.screenings).phq9
  const format = (value: string) => formatDate(new Date(value), timeZone, locale)

  return (
    <div className="space-y-6">
      <Link
        href="/pro"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <span aria-hidden>←</span>
        {t('patient.back')}
      </Link>
      <PageTitle kicker={t('patient.kicker')} title={patient.name ?? t('patients.unnamed')} />
      <div className="max-w-[40rem] space-y-1 leading-relaxed text-muted-foreground">
        <p>{t('patient.since', { date: format(patient.startedAt) })}</p>
        <p>{patient.sharesHistory ? t('patient.withHistory') : t('patient.fromLink')}</p>
      </div>
      {flagged?.hasRiskFlag === true && (
        <div className="max-w-[40rem] space-y-2 rounded-[18px] bg-danger/[0.07] px-5 py-4">
          <RiskMarker className="bg-transparent px-0 py-0" />
          <p className="leading-relaxed">
            {t('risk.detail', { date: format(flagged.completedAt) })}
          </p>
        </div>
      )}
    </div>
  )
}
