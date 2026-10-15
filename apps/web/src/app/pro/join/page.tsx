import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { chooseLocale } from '@/features/locale/actions'
import { joinAsProfessional } from '@/features/professional/actions'
import { JoinForm } from '@/features/professional/components/join-form'
import { ProLanding } from '@/features/professional/components/pro-landing'
import { PageTitle } from '@/shared/components/page-title'
import { Wordmark } from '@/shared/components/wordmark'
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
  await requireProfile()
  if ((await fetchProfessional()) !== null) {
    redirect('/pro')
  }
  const t = await getTranslations('professional')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6">
      <header className="py-6">
        <Wordmark />
      </header>
      <main className="flex-1 pt-8 pb-16 sm:pt-14">
        <div className="max-w-3xl space-y-10">
          <PageTitle
            kicker={t('join.kicker')}
            title={t('form.title')}
            description={t('form.lead')}
          />
          <div className="max-w-xl">
            <JoinForm join={joinAsProfessional} />
          </div>
        </div>
      </main>
    </div>
  )
}
