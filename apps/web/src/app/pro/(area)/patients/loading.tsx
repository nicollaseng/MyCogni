import { useTranslations } from 'next-intl'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { TableSkeleton } from '@/features/professional/components/workspace-skeleton'
import { LoadingState, Skeleton } from '@/shared/components/skeleton'

export default function ProfessionalPatientsLoading() {
  const t = useTranslations('professional.patients')

  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <WorkspaceHeader
        title={t('title')}
        description={t('description')}
        actions={<Skeleton className="h-9 w-40 rounded-md" />}
      />
      <div className="space-y-3">
        <Skeleton className="h-9 w-72 max-w-full rounded-md" />
        <Skeleton className="h-9 w-full max-w-3xl rounded-md" />
      </div>
      <TableSkeleton rows={5} />
    </LoadingState>
  )
}
