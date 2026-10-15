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
      <div className="space-y-4">
        <Skeleton className="h-11 w-full rounded-md" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-10 rounded-md" />
          ))}
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
