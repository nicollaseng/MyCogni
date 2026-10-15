import {
  SectionTitleSkeleton,
  StatStripSkeleton,
} from '@/features/professional/components/workspace-skeleton'
import { LoadingState, Skeleton, SkeletonPanel } from '@/shared/components/skeleton'

export default function PatientFileLoading() {
  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-start gap-4">
          <Skeleton className="size-14 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-96 max-w-full" />
          </div>
        </div>
      </div>
      <StatStripSkeleton />
      <div className="space-y-3">
        <SectionTitleSkeleton />
        <SkeletonPanel className="h-20" />
      </div>
      <div className="space-y-3">
        <SectionTitleSkeleton />
        <SkeletonPanel className="h-72" />
      </div>
    </LoadingState>
  )
}
