import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import {
  LinesSkeleton,
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function TodayLoading() {
  const t = useTranslations('today')

  return (
    <LoadingState className="space-y-10">
      <PageTitle kicker={<Skeleton className="my-[3px] h-3.5 w-44" />} title={t('title')} />
      <div className="flex items-center gap-6 sm:gap-10">
        <Skeleton className="size-32 shrink-0 rounded-full sm:size-40" />
        <div className="w-full space-y-4">
          <LinesSkeleton widths={['w-full max-w-sm', 'w-3/4 max-w-xs']} />
          <Skeleton className="h-11 w-48 rounded-md" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <SectionSkeleton>
        <Skeleton className="h-5 w-4/5 max-w-md" />
        <SkeletonPanel className="h-44" />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-32" />
      </SectionSkeleton>
    </LoadingState>
  )
}
