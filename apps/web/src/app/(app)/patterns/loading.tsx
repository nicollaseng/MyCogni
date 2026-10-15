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
      <SectionSkeleton>
        <LinesSkeleton widths={['w-40', 'w-4/5', 'w-3/5']} />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-28" />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-48" />
      </SectionSkeleton>
    </LoadingState>
  )
}
