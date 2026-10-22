import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { reviewAs } from '@/features/admin/actions'
import { ReviewComparison } from '@/features/admin/components/review-comparison'
import { ReviewHistory } from '@/features/admin/components/review-history'
import { ReviewPanel } from '@/features/admin/components/review-panel'
import { BackIcon } from '@/features/professional/components/icons'
import { WorkspaceHeader, WorkspaceSection } from '@/features/professional/components/workspace'
import { fetchProfessionalReview } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.professionals')
  return { title: t('title') }
}

export default async function AdminProfessionalReviewPage({
  params,
}: PageProps<'/admin/professionals/[id]'>) {
  const { id } = await params
  if (!z.uuid().safeParse(id).success) {
    notFound()
  }
  const [professional, { timezone }, t, kinds] = await Promise.all([
    fetchProfessionalReview(id),
    requireProfile(),
    getTranslations('admin.professionals'),
    getTranslations('common.professionalKinds'),
  ])
  if (professional === null) {
    notFound()
  }
  const summary = [kinds(professional.kind), professional.registration, professional.email]
    .filter((part) => part !== null)
    .join(' · ')

  return (
    <>
      <WorkspaceHeader
        kicker={
          <Link
            href="/admin/professionals"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
          >
            <BackIcon className="size-4" />
            {t('detail.back')}
          </Link>
        }
        title={professional.fullName}
        description={summary}
      />
      <WorkspaceSection title={t('detail.compare')} description={t('detail.compareHint')}>
        <ReviewComparison professional={professional} timeZone={timezone} />
      </WorkspaceSection>
      <WorkspaceSection title={t('detail.decision.title')} className="max-w-3xl">
        <ReviewPanel professional={professional} review={reviewAs} />
      </WorkspaceSection>
      <WorkspaceSection title={t('detail.history.title')} className="max-w-4xl">
        <ReviewHistory history={professional.history} timeZone={timezone} />
      </WorkspaceSection>
    </>
  )
}
