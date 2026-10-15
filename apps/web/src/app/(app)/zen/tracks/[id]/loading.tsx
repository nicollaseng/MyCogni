import { LinesSkeleton, LoadingState, RowsSkeleton, Skeleton } from '@/shared/components/skeleton'

export default function ZenTrackLoading() {
  return (
    <LoadingState className="space-y-10">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/5 sm:h-12" />
        <LinesSkeleton widths={['w-full max-w-[36rem]', 'w-2/3 max-w-sm']} />
      </div>
      <RowsSkeleton rows={4} />
    </LoadingState>
  )
}
