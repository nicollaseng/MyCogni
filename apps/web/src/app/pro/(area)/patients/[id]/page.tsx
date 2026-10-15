import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { CheckInTable } from '@/features/professional/components/check-in-table'
import { MoodChart } from '@/features/professional/components/mood-chart'
import { PatientHeader } from '@/features/professional/components/patient-header'
import { PatientKpis } from '@/features/professional/components/patient-kpis'
import { QuestionnaireTable } from '@/features/professional/components/questionnaire-table'
import { ReadingsSection } from '@/features/professional/components/readings-section'
import { Surface, WorkspaceSection } from '@/features/professional/components/workspace'
import { moodDays } from '@/features/professional/mood-days'
import {
  fetchPatient,
  fetchPatientAssessments,
  fetchPatientCheckIns,
  fetchPatientInsights,
} from '@/shared/lib/api/care'
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
  const [checkIns, assessments, readings, t] = await Promise.all([
    fetchPatientCheckIns(patient.id, new Date(now.getTime() - (windowDays + 1) * dayInMs)),
    fetchPatientAssessments(patient.id),
    fetchPatientInsights(patient.id),
    getTranslations('professional.patient'),
  ])

  return (
    <>
      <PatientHeader patient={patient} timeZone={timezone} />
      <PatientKpis patient={patient} timeZone={timezone} />
      <ReadingsSection readings={readings} timeZone={timezone} />
      <WorkspaceSection title={t('mood.title', { days: windowDays })}>
        <Surface className="px-3 pt-3 pb-2 sm:px-5 sm:pt-4">
          <MoodChart days={moodDays(checkIns, { timeZone: timezone, now, days: windowDays })} />
        </Surface>
      </WorkspaceSection>
      <WorkspaceSection title={t('entries.title', { days: windowDays })}>
        <CheckInTable checkIns={checkIns} timeZone={timezone} days={windowDays} />
      </WorkspaceSection>
      <WorkspaceSection title={t('screenings.title')} description={t('screenings.note')}>
        <QuestionnaireTable assessments={assessments} timeZone={timezone} />
      </WorkspaceSection>
    </>
  )
}
