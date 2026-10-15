import { useTranslations } from 'next-intl'
import {
  descriptionWidths,
  LinesSkeleton,
  LoadingState,
  RowsSkeleton,
  SectionSkeleton,
  Skeleton,
} from '@/shared/components/skeleton'

export default function MybookLoading() {
  const t = useTranslations('mybook.list')

  return (
    <LoadingState className="space-y-10">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl">
            {t('title')}
          </h1>
          <div className="pt-1 sm:pt-2">
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
        <LinesSkeleton widths={descriptionWidths} className="pt-1" />
        <Skeleton className="mt-2 h-4 w-64" />
      </header>
      <div className="space-y-8">
        <Skeleton className="h-12 w-full rounded-md" />
        <SectionSkeleton>
          <RowsSkeleton rows={5} className="pt-2" />
        </SectionSkeleton>
      </div>
    </LoadingState>
  )
}
