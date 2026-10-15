import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { EntryAddenda } from '@/features/entries/components/entry-addenda'
import { EntryDetail } from '@/features/entries/components/entry-detail'
import { requireVerifiedProfessional } from '@/features/professional/access'
import { fetchPatient, fetchPatientCheckIn } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('entries.meta')
  return { title: t('detail') }
}

export default async function PatientEntryPage({
  params,
}: PageProps<'/pro/patients/[id]/entries/[checkInId]'>) {
  await requireVerifiedProfessional()
  const { id, checkInId } = await params
  const [patient, { timezone }, t, patients] = await Promise.all([
    fetchPatient(id),
    requireProfile(),
    getTranslations('entries.detail'),
    getTranslations('professional.patients'),
  ])
  if (patient === null) {
    notFound()
  }
  const checkIn = await fetchPatientCheckIn(patient.id, checkInId)
  if (checkIn === null) {
    notFound()
  }
  const name = patient.name ?? patients('unnamed')

  return (
    <div className="max-w-3xl">
      <EntryDetail
        checkIn={checkIn}
        timeZone={timezone}
        back={{ href: `/pro/patients/${patient.id}`, label: name }}
      >
        <EntryAddenda addenda={checkIn.addenda} timeZone={timezone} />
        <p className="text-sm text-muted-foreground">{t('readOnly')}</p>
      </EntryDetail>
    </div>
  )
}
