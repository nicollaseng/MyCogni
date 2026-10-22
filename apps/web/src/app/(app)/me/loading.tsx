import { LinesSkeleton, LoadingState, Skeleton, SkeletonPanel } from '@/shared/components/skeleton'

export default function MeLoading() {
  return (
    <LoadingState className="space-y-8">
      <Skeleton className="h-9 w-48" />
      <div className="flex items-center gap-5">
        <Skeleton className="size-20 shrink-0 rounded-full" />
        <LinesSkeleton widths={['w-40', 'w-56 max-w-full']} className="min-w-0 flex-1" />
      </div>
      <SkeletonPanel className="h-32" />
      <SkeletonPanel className="h-20" />
    </LoadingState>
  )
}
