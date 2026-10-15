import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import {
  descriptionWidths,
  LinesSkeleton,
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function PatternsLoading() {
  const t = useTranslations('patterns')

  return (
    <LoadingState className="space-y-10">
      <PageTitle
        title={t('title')}
        description={<LinesSkeleton widths={descriptionWidths} className="pt-1" />}
        action={<Skeleton className="h-10 w-48 rounded-md" />}
      />
      <Skeleton className="h-10 w-full rounded-md sm:w-72" />
      <SectionSkeleton>
        <SkeletonPanel className="h-64 sm:h-32" />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-48" />
      </SectionSkeleton>
    </LoadingState>
  )
}
