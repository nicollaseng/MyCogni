import { useTranslations } from 'next-intl'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import {
  SectionTitleSkeleton,
  StatStripSkeleton,
} from '@/features/professional/components/workspace-skeleton'
import { LinesSkeleton, LoadingState, Skeleton, SkeletonPanel } from '@/shared/components/skeleton'

export default function ProfessionalOverviewLoading() {
  const t = useTranslations('professional.overview')

  return (
    <LoadingState>
      <div className="space-y-7 group-data-[shell=onboarding]/shell:hidden lg:space-y-9">
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
      </div>
      <div className="hidden space-y-7 group-data-[shell=onboarding]/shell:block lg:space-y-9">
        <div className="space-y-2.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-72 max-w-full" />
          <LinesSkeleton widths={['w-full max-w-[44rem]', 'w-2/3 max-w-md']} />
        </div>
        <SkeletonPanel className="h-48" />
      </div>
    </LoadingState>
  )
}
