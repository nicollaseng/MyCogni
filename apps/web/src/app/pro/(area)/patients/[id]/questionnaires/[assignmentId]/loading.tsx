import {
  SectionTitleSkeleton,
  StatStripSkeleton,
} from '@/features/professional/components/workspace-skeleton'
import { LoadingState, Skeleton, SkeletonPanel } from '@/shared/components/skeleton'

export default function AssignmentResultLoading() {
  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-48 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <SkeletonPanel className="h-16" />
      <StatStripSkeleton />
      <div className="space-y-3">
        <SectionTitleSkeleton />
        <SkeletonPanel className="h-72" />
      </div>
    </LoadingState>
  )
}
