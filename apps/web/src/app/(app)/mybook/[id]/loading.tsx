import { LinesSkeleton, LoadingState, Skeleton } from '@/shared/components/skeleton'

export default function MybookEntryLoading() {
  return (
    <LoadingState className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-10 w-3/5 sm:h-12" />
      <LinesSkeleton widths={['w-full', 'w-full', 'w-11/12', 'w-4/5', 'w-2/3']} />
    </LoadingState>
  )
}
