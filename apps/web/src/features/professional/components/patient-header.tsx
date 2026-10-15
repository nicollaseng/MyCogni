import type { PatientSummary } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Avatar } from '@/shared/components/avatar'
import { initialsOf } from '@/shared/lib/initials'
import { formatDate, formatShortDate } from '../dates'
import { latestScreenings } from '../screenings'
import { AlertIcon, BackIcon } from './icons'
import { AttentionReasons } from './patient-cells'
import { WorkspaceHeader } from './workspace'

interface PatientHeaderProps {
  patient: PatientSummary
  timeZone: string
  actions?: ReactNode
}

export function PatientHeader({ patient, timeZone, actions }: PatientHeaderProps) {
  const t = useTranslations('professional')
  const locale = useLocale()
  const flagged = latestScreenings(patient.screenings).phq9

  return (
    <div className="space-y-4">
      <Link
        href="/pro/patients"
        className="-ml-1 inline-flex items-center gap-1 rounded-[4px] py-1 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <BackIcon className="size-4" />
        {t('patient.back')}
      </Link>
      <div className="flex items-start gap-4 sm:gap-5">
        <Avatar
          src={patient.photoUrl}
          initials={initialsOf(patient.name)}
          size="lg"
          className="mt-1"
        />
        <div className="min-w-0 flex-1">
          <WorkspaceHeader
            kicker={t('patient.kicker')}
            title={patient.name ?? t('patients.unnamed')}
            actions={actions}
            description={
              <p>
                {t('patient.since', {
                  date: formatShortDate(new Date(patient.startedAt), timeZone, locale),
                })}
                <span aria-hidden> · </span>
                <span className="sr-only">. </span>
                {patient.sharesHistory ? t('patient.withHistory') : t('patient.fromLink')}
              </p>
            }
          >
            {patient.attention.length > 0 && (
              <div className="pt-2">
                <AttentionReasons reasons={patient.attention} />
              </div>
            )}
            <Link
              href={`/pro/patients/${patient.id}/mybook`}
              className="inline-block pt-2 text-sm underline decoration-1 underline-offset-4"
            >
              {t('patient.mybook')}
            </Link>
          </WorkspaceHeader>
        </div>
      </div>
      {flagged?.hasRiskFlag === true && (
        <div className="flex max-w-3xl gap-3 rounded-[8px] bg-(--warn-soft) px-4 py-3.5">
          <AlertIcon className="mt-0.5 text-(--warn)" />
          <p className="leading-relaxed">
            {t('risk.detail', {
              date: formatDate(new Date(flagged.completedAt), timeZone, locale),
            })}
          </p>
        </div>
      )}
    </div>
  )
}
