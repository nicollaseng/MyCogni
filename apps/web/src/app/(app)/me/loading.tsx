import {
  LinesSkeleton,
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function MeLoading() {
  return (
    <LoadingState className="space-y-12">
      <div className="flex items-center gap-5">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
          <Skeleton className="h-4 w-44" />
        </div>
      </div>
      <SectionSkeleton>
        <div className="grid grid-cols-2 gap-6">
          <LinesSkeleton widths={['w-32', 'w-16', 'w-20']} />
          <LinesSkeleton widths={['w-32', 'w-16', 'w-20']} />
        </div>
        <LinesSkeleton widths={['w-full', 'w-3/5']} className="pt-2" />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-32" />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-40" />
      </SectionSkeleton>
    </LoadingState>
  )
}
