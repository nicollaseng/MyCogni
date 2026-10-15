import { useTranslations } from 'next-intl'
import { WorkspaceHeader } from '@/features/professional/components/workspace'
import { TableSkeleton } from '@/features/professional/components/workspace-skeleton'
import {
  descriptionWidths,
  LinesSkeleton,
  LoadingState,
  Skeleton,
} from '@/shared/components/skeleton'

export default function ProfessionalInvitesLoading() {
  const t = useTranslations('professional.invites')

  return (
    <LoadingState className="space-y-7 lg:space-y-9">
      <WorkspaceHeader
        title={t('title')}
        description={<LinesSkeleton widths={descriptionWidths} className="pt-1" />}
        actions={<Skeleton className="h-9 w-40 rounded-md" />}
      />
      <TableSkeleton rows={4} />
    </LoadingState>
  )
}
