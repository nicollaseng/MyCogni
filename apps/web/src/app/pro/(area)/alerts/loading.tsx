import { useTranslations } from 'next-intl'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { TableSkeleton } from '@/features/professional/components/workspace-skeleton'
import { descriptionWidths, LinesSkeleton, LoadingState } from '@/shared/components/skeleton'

export default function ProfessionalAlertsLoading() {
  const t = useTranslations('alerts')

  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <WorkspaceHeader
        title={t('title')}
        description={<LinesSkeleton widths={descriptionWidths} className="pt-1" />}
      />
      <TableSkeleton rows={4} />
    </LoadingState>
  )
}
