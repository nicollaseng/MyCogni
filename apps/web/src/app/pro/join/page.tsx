import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { signOut, signOutForProfessionalSignUp } from '@/features/auth/actions'
import { chooseLocale } from '@/features/locale/actions'
import { joinAsProfessional } from '@/features/professional/actions'
import { JoinForm } from '@/features/professional/components/join-form'
import { JoinFrame } from '@/features/professional/components/join-frame'
import { PatientAccountNotice } from '@/features/professional/components/patient-account-notice'
import { ProLanding } from '@/features/professional/components/pro-landing'
import { PageTitle } from '@/shared/components/page-title'
import { fetchProfessional } from '@/shared/lib/api/care'
import { currentUser, requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('join') }
}

export default async function ProfessionalJoinPage() {
  if ((await currentUser()) === null) {
    return <ProLanding chooseLocale={chooseLocale} />
  }
  const [profile, professional] = await Promise.all([requireProfile(), fetchProfessional()])
  if (profile.accountType === 'patient') {
    return (
      <JoinFrame>
        <PatientAccountNotice signOut={signOutForProfessionalSignUp} />
      </JoinFrame>
    )
  }
  if (professional !== null) {
    redirect('/pro')
  }
  const t = await getTranslations('professional')

  return (
    <JoinFrame signOut={signOut}>
      <div className="max-w-3xl space-y-10">
        <PageTitle kicker={t('join.kicker')} title={t('form.title')} description={t('form.lead')} />
        <div className="max-w-xl">
          <JoinForm join={joinAsProfessional} />
        </div>
      </div>
    </JoinFrame>
  )
}
