import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { requireProfessional } from '@/features/professional/access'
import { PatientList } from '@/features/professional/components/patient-list'
import { VerificationNotice } from '@/features/professional/components/verification-notice'
import { PageTitle } from '@/shared/components/page-title'
import { fetchPatients } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'
import { buttonVariants } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('patients') }
}

export default async function ProfessionalHomePage() {
  const [professional, { timezone }] = await Promise.all([requireProfessional(), requireProfile()])
  if (professional.status !== 'verified') {
    return <VerificationNotice professional={professional} timeZone={timezone} />
  }
  const [patients, t] = await Promise.all([
    fetchPatients(),
    getTranslations('professional.patients'),
  ])

  return (
    <>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <PageTitle title={t('title')} description={t('description')} />
        {patients.length > 0 && (
          <Link
            href="/pro/invites"
            className={buttonVariants({ variant: 'outline', shape: 'pill', className: 'w-fit' })}
          >
            {t('invite')}
          </Link>
        )}
      </div>
      <PatientList patients={patients} timeZone={timezone} now={new Date()} />
    </>
  )
}
