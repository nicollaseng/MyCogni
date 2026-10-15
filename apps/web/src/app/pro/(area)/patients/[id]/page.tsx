import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { EntryList } from '@/features/entries/components/entry-list'
import { groupByDay } from '@/features/entries/group-by-day'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { MoodOverview } from '@/features/professional/components/mood-overview'
import { PatientHeader } from '@/features/professional/components/patient-header'
import { ScreeningTimeline } from '@/features/professional/components/screening-timeline'
import { Panel, Section } from '@/shared/components/section'
import { fetchPatient, fetchPatientAssessments, fetchPatientCheckIns } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('patient') }
}

const windowDays = 30
const dayInMs = 24 * 60 * 60 * 1000

export default async function PatientPage({ params }: PageProps<'/pro/patients/[id]'>) {
  await requireVerifiedProfessional()
  const { id } = await params
  const [patient, { timezone }] = await Promise.all([fetchPatient(id), requireProfile()])
  if (patient === null) {
    notFound()
  }
  const now = new Date()
  const [checkIns, assessments, t] = await Promise.all([
    fetchPatientCheckIns(patient.id, new Date(now.getTime() - (windowDays + 1) * dayInMs)),
    fetchPatientAssessments(patient.id),
    getTranslations('professional.patient.entries'),
  ])

  return (
    <>
      <PatientHeader patient={patient} timeZone={timezone} />
      <MoodOverview checkIns={checkIns} timeZone={timezone} now={now} days={windowDays} />
      <ScreeningTimeline assessments={assessments} timeZone={timezone} />
      <Section title={t('title', { days: windowDays })}>
        {checkIns.length === 0 ? (
          <Panel>
            <p className="py-3.5 text-muted-foreground">{t('empty', { days: windowDays })}</p>
          </Panel>
        ) : (
          <div className="max-w-3xl pt-2">
            <EntryList
              groups={groupByDay(checkIns, { timeZone: timezone, now })}
              timeZone={timezone}
            />
          </div>
        )}
      </Section>
    </>
  )
}
