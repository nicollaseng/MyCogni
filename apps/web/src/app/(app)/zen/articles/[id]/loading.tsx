import { LinesSkeleton, LoadingState, Skeleton } from '@/shared/components/skeleton'

export default function ZenArticleLoading() {
  return (
    <LoadingState className="space-y-8">
      <span aria-hidden className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </span>
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-3/5 sm:h-12" />
      <LinesSkeleton widths={['w-full', 'w-full', 'w-11/12', 'w-4/5', 'w-2/3']} />
    </LoadingState>
  )
}
