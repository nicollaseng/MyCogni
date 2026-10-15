import { useTranslations } from 'next-intl'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import {
  SectionTitleSkeleton,
  StatStripSkeleton,
} from '@/features/professional/components/workspace-skeleton'
import { LoadingState, Skeleton, SkeletonPanel } from '@/shared/components/skeleton'

export default function ProfessionalOverviewLoading() {
  const t = useTranslations('professional.overview')

  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <WorkspaceHeader
        title={t('title')}
        description={<Skeleton className="my-1 h-4 w-40" />}
        actions={<Skeleton className="h-9 w-40 rounded-md" />}
      />
      <StatStripSkeleton />
      <div className="space-y-3">
        <SectionTitleSkeleton />
        <SkeletonPanel className="h-16" />
      </div>
      <div className="grid gap-x-8 gap-y-7 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="space-y-3">
          <SectionTitleSkeleton />
          <SkeletonPanel className="h-72" />
        </div>
        <div className="space-y-3">
          <SectionTitleSkeleton />
          <SkeletonPanel className="h-72" />
        </div>
      </div>
    </LoadingState>
  )
}
