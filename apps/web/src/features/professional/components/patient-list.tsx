import type { PatientSummary, ScreeningSummary } from '@mycogni/contracts'
import { instrumentIds, instruments, maxScoreOf } from '@mycogni/domain'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { isMoodLevel, moodColor, moodKeyOf, valenceOf } from '@/features/mood/mood-levels'
import { Panel } from '@/shared/components/section'
import { buttonVariants } from '@/shared/ui/button'
import { daysAgo, formatDate } from '../dates'
import { latestScreenings } from '../screenings'
import { RiskMarker } from './risk-marker'

const recentDays = 6

interface PatientListProps {
  patients: readonly PatientSummary[]
  timeZone: string
  now: Date
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function LastCheckIn({
  lastCheckIn,
  timeZone,
  now,
}: {
  lastCheckIn: PatientSummary['lastCheckIn']
  timeZone: string
  now: Date
}) {
  const t = useTranslations('professional.patients')
  const mood = useTranslations('common.mood')
  const locale = useLocale()
  if (lastCheckIn === null || !isMoodLevel(lastCheckIn.moodLevel)) {
    return <span className="text-muted-foreground">{t('noCheckIn')}</span>
  }
  const recordedAt = new Date(lastCheckIn.recordedAt)
  const days = daysAgo(recordedAt, now, timeZone)
  return (
    <>
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: moodColor(valenceOf(lastCheckIn.moodLevel)) }}
        />
        {mood(moodKeyOf(lastCheckIn.moodLevel))}
      </span>
      <time dateTime={lastCheckIn.recordedAt} className="block text-sm text-muted-foreground">
        {days <= recentDays ? t('ago', { days }) : formatDate(recordedAt, timeZone, locale)}
      </time>
    </>
  )
}

function ScreeningValue({ screening }: { screening: ScreeningSummary | undefined }) {
  const t = useTranslations('professional.patients')
  const severity = useTranslations('screening.severity')
  if (screening === undefined) {
    return <span className="text-muted-foreground">{t('notAnswered')}</span>
  }
  const max = maxScoreOf(instruments[screening.instrument])
  return (
    <>
      {severity(screening.severity)}
      <span className="text-sm text-muted-foreground">
        {' '}
        · {screening.totalScore}/{max}
      </span>
    </>
  )
}

function PatientCard({
  patient,
  timeZone,
  now,
}: { patient: PatientSummary } & Omit<PatientListProps, 'patients'>) {
  const t = useTranslations('professional.patients')
  const locale = useLocale()
  const latest = latestScreenings(patient.screenings)

  return (
    <Panel className="relative h-full space-y-5 py-5 transition-colors has-[a:hover]:bg-sage">
      <header className="space-y-1">
        <h2 className="font-serif text-2xl leading-tight">
          <Link
            href={`/pro/patients/${patient.id}`}
            className="after:absolute after:inset-0 after:rounded-[22px]"
          >
            {patient.name ?? t('unnamed')}
          </Link>
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('since', { date: formatDate(new Date(patient.startedAt), timeZone, locale) })}
        </p>
      </header>
      {latest.phq9?.hasRiskFlag === true && <RiskMarker />}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Fact label={t('lastCheckIn')}>
          <LastCheckIn lastCheckIn={patient.lastCheckIn} timeZone={timeZone} now={now} />
        </Fact>
        <Fact label={t('lastWeek')}>{t('weekCount', { count: patient.checkInsLastWeek })}</Fact>
        {instrumentIds.map((id) => (
          <Fact key={id} label={instruments[id].name}>
            <ScreeningValue screening={latest[id]} />
          </Fact>
        ))}
      </dl>
    </Panel>
  )
}

function EmptyPatients() {
  const t = useTranslations('professional.patients')
  return (
    <Panel className="max-w-2xl space-y-3 py-7">
      <h2 className="font-serif text-2xl leading-tight">{t('emptyTitle')}</h2>
      <p className="leading-relaxed text-muted-foreground">{t('emptyBody')}</p>
      <Link href="/pro/invites" className={buttonVariants({ shape: 'pill', className: 'mt-2' })}>
        {t('invite')}
      </Link>
    </Panel>
  )
}

export function PatientList({ patients, timeZone, now }: PatientListProps) {
  if (patients.length === 0) {
    return <EmptyPatients />
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {patients.map((patient) => (
        <li key={patient.linkId}>
          <PatientCard patient={patient} timeZone={timeZone} now={now} />
        </li>
      ))}
    </ul>
  )
}
