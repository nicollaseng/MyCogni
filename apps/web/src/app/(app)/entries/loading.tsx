import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import {
  descriptionWidths,
  LinesSkeleton,
  LoadingState,
  RowsSkeleton,
  SectionSkeleton,
  Skeleton,
} from '@/shared/components/skeleton'

export default function EntriesLoading() {
  const t = useTranslations('entries')

  return (
    <LoadingState className="space-y-10">
      <PageTitle
        title={t('title')}
        description={<LinesSkeleton widths={descriptionWidths} className="pt-1" />}
        action={<Skeleton className="h-10 w-48 rounded-md" />}
      />
      <div className="space-y-6">
        <div className="flex gap-2">
          <Skeleton className="h-11 min-w-0 flex-1 rounded-md" />
          <Skeleton className="h-11 w-28 rounded-md" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="space-y-8">
        <Skeleton className="h-4 w-24" />
        <SectionSkeleton>
          <RowsSkeleton rows={5} />
        </SectionSkeleton>
      </div>
    </LoadingState>
  )
}
