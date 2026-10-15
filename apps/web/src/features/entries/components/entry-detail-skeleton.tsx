import { LinesSkeleton, LoadingState, Skeleton } from '@/shared/components/skeleton'

export function EntryDetailSkeleton() {
  return (
    <LoadingState className="space-y-8">
      <Skeleton className="h-4 w-24" />
      <div className="flex items-center gap-5 sm:gap-8">
        <Skeleton className="size-28 shrink-0 rounded-full sm:size-36" />
        <LinesSkeleton widths={['w-48 h-9', 'w-44', 'w-16']} className="min-w-0 flex-1" />
      </div>
      <LinesSkeleton widths={['w-20', 'w-32', 'w-20', 'w-40', 'w-16', 'w-full', 'w-3/4']} />
      <Skeleton className="h-12 w-40 rounded-md" />
    </LoadingState>
  )
}
