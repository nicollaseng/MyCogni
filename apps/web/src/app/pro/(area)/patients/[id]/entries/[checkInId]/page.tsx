import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { EntryAddenda } from '@/features/entries/components/entry-addenda'
import { EntryDetail } from '@/features/entries/components/entry-detail'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { fetchPatient, fetchPatientCheckIn } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('entries.meta')
  return { title: t('detail') }
}

async function patientEntryOf(
  params: PageProps<'/pro/patients/[id]/entries/[checkInId]'>['params'],
) {
  const { id, checkInId } = await params
  return Promise.all([
    fetchPatient(id),
    fetchPatientCheckIn(id, checkInId),
    requireProfile(),
    getTranslations('entries.detail'),
    getTranslations('professional.patients'),
  ])
}

export default async function PatientEntryPage({
  params,
}: PageProps<'/pro/patients/[id]/entries/[checkInId]'>) {
  const [, [patient, checkIn, { timezone }, t, patients]] = await guarded(
    requireVerifiedProfessional(),
    patientEntryOf(params),
  )
  if (patient === null || checkIn === null) {
    notFound()
  }

  return (
    <div className="max-w-3xl">
      <EntryDetail
        checkIn={checkIn}
        timeZone={timezone}
        back={{ href: `/pro/patients/${patient.id}`, label: patient.name ?? patients('unnamed') }}
      >
        <EntryAddenda addenda={checkIn.addenda} timeZone={timezone} />
        <p className="text-sm text-muted-foreground">{t('readOnly')}</p>
      </EntryDetail>
    </div>
  )
}
