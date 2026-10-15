import { LoadingState, RowsSkeleton, Skeleton } from '@/shared/components/skeleton'

export default function SharedJournalLoading() {
  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <RowsSkeleton rows={5} />
    </LoadingState>
  )
}
