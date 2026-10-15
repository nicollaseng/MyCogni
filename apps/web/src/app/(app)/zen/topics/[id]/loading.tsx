import {
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function ZenTopicLoading() {
  return (
    <LoadingState className="space-y-10">
      <span aria-hidden className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </span>
      <Skeleton className="h-10 w-2/5 sm:h-12" />
      <SectionSkeleton>
        <SkeletonPanel className="h-16" />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-40" />
      </SectionSkeleton>
    </LoadingState>
  )
}
