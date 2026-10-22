import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { AssignmentResult } from '@/features/professional/components/assignment-result'
import { fetchPatient } from '@/shared/lib/api/care'
import { ApiError } from '@/shared/lib/api/client'
import { fetchAssignmentDetail } from '@/shared/lib/api/questionnaires'
import { requireProfile } from '@/shared/lib/auth/session'
import { settledValue } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('assignments.section')
  return { title: t('title') }
}

function isMissing(cause: unknown): boolean {
  return cause instanceof ApiError && (cause.status === 404 || cause.status === 400)
}

export default async function AssignmentResultPage({
  params,
}: PageProps<'/pro/patients/[id]/questionnaires/[assignmentId]'>) {
  const { id, assignmentId } = await params
  const [access, file] = await Promise.allSettled([
    Promise.all([requireVerifiedProfessional(), requireProfile()]),
    Promise.all([
      fetchPatient(id),
      fetchAssignmentDetail(id, assignmentId),
      getTranslations('professional.patients'),
    ]),
  ])
  const [, { timezone }] = settledValue(access)
  if (file.status === 'rejected' && isMissing(file.reason)) {
    notFound()
  }
  const [patient, detail, patients] = settledValue(file)
  if (patient === null) {
    notFound()
  }
  return (
    <AssignmentResult
      detail={detail}
      patientName={patient.name ?? patients('unnamed')}
      timeZone={timezone}
    />
  )
}
