import { SectionTitleSkeleton } from '@/features/professional/components/workspace-skeleton'
import { LinesSkeleton, LoadingState, SkeletonPanel } from '@/shared/components/skeleton'

export default function ProfessionalSupportLoading() {
  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <div className="space-y-3">
        <SectionTitleSkeleton />
        <LinesSkeleton widths={['w-full max-w-xl', 'w-2/3 max-w-md']} />
      </div>
      <SkeletonPanel className="h-72 max-w-3xl" />
    </LoadingState>
  )
}
