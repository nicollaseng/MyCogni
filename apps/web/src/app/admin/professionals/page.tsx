import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { reviewAs } from '@/features/admin/actions'
import { ProfessionalReviewList } from '@/features/admin/components/professional-review-list'
import { ReviewTabs } from '@/features/admin/components/review-tabs'
import { statusOf } from '@/features/admin/review'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { fetchProfessionalsForReview } from '@/shared/lib/api/care'
import { requireProfile } from '@/shared/lib/auth/session'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.professionals')
  return { title: t('title') }
}

export default async function AdminProfessionalsPage({
  searchParams,
}: PageProps<'/admin/professionals'>) {
  const status = statusOf((await searchParams).status)
  const [professionals, { timezone }, t] = await Promise.all([
    fetchProfessionalsForReview(status),
    requireProfile(),
    getTranslations('admin.professionals'),
  ])
  if (professionals === null) {
    notFound()
  }

  return (
    <>
      <WorkspaceHeader title={t('title')} description={t('description')} />
      <ReviewTabs current={status} />
      <ProfessionalReviewList
        key={status}
        professionals={professionals}
        status={status}
        timeZone={timezone}
        review={reviewAs}
      />
    </>
  )
}
