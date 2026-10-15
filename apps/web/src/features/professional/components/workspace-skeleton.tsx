import { Skeleton, SkeletonPanel } from '@/shared/components/skeleton'

export function StatStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4 lg:gap-x-6">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="space-y-2 py-1">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-7 w-12" />
          <Skeleton className="h-3.5 w-36 max-w-full" />
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({ rows }: { rows: number }) {
  return (
    <SkeletonPanel className="space-y-5 px-4 py-4">
      <Skeleton className="h-3.5 w-1/2" />
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto h-4 w-1/3" />
        </span>
      ))}
    </SkeletonPanel>
  )
}

export function SectionTitleSkeleton() {
  return <Skeleton className="h-6 w-48" />
}
