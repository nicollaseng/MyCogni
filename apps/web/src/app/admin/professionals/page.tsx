import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { ProfessionalReviewList } from '@/features/admin/components/professional-review-list'
import { ReviewTabs } from '@/features/admin/components/review-tabs'
import { professionalsInView, statusOfView, viewOf } from '@/features/admin/review'
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
  const view = viewOf((await searchParams).status)
  const [professionals, { timezone }, t] = await Promise.all([
    fetchProfessionalsForReview(statusOfView(view)),
    requireProfile(),
    getTranslations('admin.professionals'),
  ])
  if (professionals === null) {
    notFound()
  }

  return (
    <>
      <WorkspaceHeader title={t('title')} description={t('description')} />
      <ReviewTabs current={view} />
      {view === 'revalidate' && (
        <p className="max-w-[44rem] text-sm text-muted-foreground">{t('revalidateHint')}</p>
      )}
      <ProfessionalReviewList
        key={view}
        professionals={professionalsInView(professionals, view, new Date())}
        view={view}
        timeZone={timezone}
      />
    </>
  )
}
