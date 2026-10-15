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
import { ReportExport } from '@/features/reports/components/report-export'
import {
  fetchPatient,
  fetchPatientAssessments,
  fetchPatientCheckIns,
  fetchPatientInsights,
} from '@/shared/lib/api/care'
import { ApiError } from '@/shared/lib/api/client'
import { requireProfile } from '@/shared/lib/auth/session'
import { settledValue } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('patient') }
}

const windowDays = 30
const dayInMs = 24 * 60 * 60 * 1000

function isMissing(cause: unknown): boolean {
  return cause instanceof ApiError && (cause.status === 404 || cause.status === 400)
}

async function patientFileOf(params: PageProps<'/pro/patients/[id]'>['params'], now: Date) {
  const { id } = await params
  return Promise.all([
    fetchPatient(id),
    fetchPatientCheckIns(id, new Date(now.getTime() - (windowDays + 1) * dayInMs)),
    fetchPatientAssessments(id),
    fetchPatientInsights(id),
    getTranslations('professional.patient'),
    getTranslations('professional.patients'),
  ])
}

export default async function PatientPage({ params }: PageProps<'/pro/patients/[id]'>) {
  const now = new Date()
  const [access, file] = await Promise.allSettled([
    Promise.all([requireVerifiedProfessional(), requireProfile()]),
    patientFileOf(params, now),
  ])
  const [, { timezone }] = settledValue(access)
  if (file.status === 'rejected' && isMissing(file.reason)) {
    notFound()
  }
  const [patient, checkIns, assessments, readings, t, patients] = settledValue(file)
  if (patient === null) {
    notFound()
  }

  return (
    <>
      <PatientHeader
        patient={patient}
        timeZone={timezone}
        actions={
          <ReportExport
            href={`/pro/patients/${patient.id}/report`}
            audience="professional"
            name={patient.name ?? patients('unnamed')}
            summaries={readings.length > 0}
            triggerClassName="h-9 px-3.5 text-sm hover:bg-surface"
          />
        }
      />
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
