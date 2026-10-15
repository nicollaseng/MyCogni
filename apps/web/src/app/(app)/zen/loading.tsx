import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import {
  LoadingState,
  RowsSkeleton,
  SectionSkeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function ZenLoading() {
  const t = useTranslations('zen')

  return (
    <LoadingState className="space-y-10">
      <PageTitle title={t('title')} description={t('description')} />
      <SectionSkeleton>
        <SkeletonPanel className="h-32" />
      </SectionSkeleton>
      <SectionSkeleton>
        <RowsSkeleton rows={4} className="pt-1" />
      </SectionSkeleton>
      <SectionSkeleton>
        <RowsSkeleton rows={3} className="pt-1" />
      </SectionSkeleton>
    </LoadingState>
  )
}
