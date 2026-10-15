import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { PlusIcon } from '@/features/professional/components/icons'
import { PatientTable } from '@/features/professional/components/patient-table'
import { compactButton, WorkspaceHeader } from '@/features/professional/components/workspace'
import { patientFilterOf } from '@/features/professional/patient-table'
import { fetchPatients } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('patients') }
}

export default async function ProfessionalPatientsPage({
  searchParams,
}: PageProps<'/pro/patients'>) {
  const [[, { timezone }], [patients, t, { filter }]] = await guarded(
    Promise.all([requireVerifiedProfessional(), requireProfile()]),
    Promise.all([fetchPatients(), getTranslations('professional.patients'), searchParams]),
  )
  const initialFilter = patientFilterOf(filter)

  return (
    <>
      <WorkspaceHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Link href={{ pathname: '/pro/invites', query: { new: '1' } }} className={compactButton}>
            <PlusIcon className="size-4" />
            {t('invite')}
          </Link>
        }
      />
      <PatientTable
        key={initialFilter}
        patients={patients}
        initialFilter={initialFilter}
        now={new Date()}
        timeZone={timezone}
      />
    </>
  )
}
