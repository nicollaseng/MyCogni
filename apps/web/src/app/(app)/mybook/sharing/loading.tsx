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

export default function MybookSharingLoading() {
  const t = useTranslations('mybook.sharing')

  return (
    <LoadingState className="space-y-10">
      <div className="space-y-6">
        <Skeleton className="h-10 w-28" />
        <PageTitle
          title={t('title')}
          description={<LinesSkeleton widths={descriptionWidths} className="pt-1" />}
        />
      </div>
      <SectionSkeleton>
        <SkeletonPanel className="h-36" />
      </SectionSkeleton>
    </LoadingState>
  )
}
