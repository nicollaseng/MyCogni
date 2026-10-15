import { useTranslations } from 'next-intl'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { SectionTitleSkeleton } from '@/features/professional/components/workspace-skeleton'
import { LoadingState, SkeletonPanel } from '@/shared/components/skeleton'

export default function ProfessionalSettingsLoading() {
  const t = useTranslations('professional.settings')

  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <WorkspaceHeader title={t('title')} description={t('description')} />
      <div className="space-y-3">
        <SectionTitleSkeleton />
        <SkeletonPanel className="h-40" />
      </div>
      <div className="space-y-3">
        <SectionTitleSkeleton />
        <SkeletonPanel className="h-32" />
      </div>
    </LoadingState>
  )
}
