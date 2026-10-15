import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { joinAsProfessional } from '@/features/professional/actions'
import { JoinForm } from '@/features/professional/components/join-form'
import { JoinIntro } from '@/features/professional/components/join-intro'
import { PageTitle } from '@/shared/components/page-title'
import { fetchProfessional } from '@/shared/lib/api/care'
import { currentUser, requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('professional.meta')
  return { title: t('join') }
}

export default async function ProfessionalJoinPage() {
  if ((await currentUser()) === null) {
    return <JoinIntro />
  }
  await requireProfile()
  if ((await fetchProfessional()) !== null) {
    redirect('/pro')
  }
  const t = await getTranslations('professional')

  return (
    <div className="space-y-10">
      <PageTitle kicker={t('join.kicker')} title={t('form.title')} description={t('form.lead')} />
      <div className="max-w-xl">
        <JoinForm join={joinAsProfessional} />
      </div>
    </div>
  )
}
