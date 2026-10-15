import { LinesSkeleton, LoadingState, Skeleton } from '@/shared/components/skeleton'

export default function SharedJournalEntryLoading() {
  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-3/5" />
      <LinesSkeleton widths={['w-full', 'w-full', 'w-11/12', 'w-4/5', 'w-2/3']} />
    </LoadingState>
  )
}
