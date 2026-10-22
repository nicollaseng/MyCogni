import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { confirmTerms, endReviewedLink } from '@/features/care/actions'
import { LinkedProfessional } from '@/features/care/components/linked-professional'
import { SharingTerms } from '@/features/care/components/sharing-terms'
import { TermsReview } from '@/features/care/components/terms-review'
import { PageTitle } from '@/shared/components/page-title'
import { Section } from '@/shared/components/section'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('care.terms.meta')
  return { title: t('title') }
}

export default async function SharingTermsReviewPage({
  params,
}: PageProps<'/me/professionals/[id]/terms'>) {
  const [{ id }, { timezone }] = await Promise.all([params, requireOnboardedProfile()])
  const link = (await fetchCareLinks()).find((candidate) => candidate.id === id)
  if (link === undefined) {
    notFound()
  }
  if (!link.termsOutdated) {
    redirect('/me/professionals')
  }
  const t = await getTranslations('care.terms')
  const { name } = link.professional

  return (
    <>
      <PageTitle kicker={t('kicker')} title={t('title')} description={t('lead', { name })} />
      <LinkedProfessional link={link} timeZone={timezone} />
      <Section title={t('changes.title')}>
        <p className="max-w-xl leading-relaxed text-pretty">{t('changes.body')}</p>
      </Section>
      <SharingTerms name={name} action="confirm" />
      <TermsReview
        id={link.id}
        name={name}
        confirm={confirmTerms.bind(null, link.id)}
        end={endReviewedLink}
      />
    </>
  )
}
