import { LinesSkeleton, LoadingState, Skeleton, SkeletonPanel } from '@/shared/components/skeleton'

export default function ZenTrackLoading() {
  return (
    <LoadingState className="space-y-10">
      <span aria-hidden className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </span>
      <div className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-3/5 sm:h-12" />
        <LinesSkeleton widths={['w-full max-w-[36rem]', 'w-2/3 max-w-sm']} />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-12 w-32 rounded-md" />
      </div>
      <span aria-hidden className="block space-y-2">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonPanel key={index} className="h-16" />
        ))}
      </span>
    </LoadingState>
  )
}
