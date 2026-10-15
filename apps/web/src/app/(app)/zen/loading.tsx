import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import {
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function ZenLoading() {
  const t = useTranslations('zen')

  return (
    <LoadingState className="space-y-10">
      <PageTitle title={t('title')} action={<Skeleton className="h-4 w-24" />} />
      <SectionSkeleton>
        <SkeletonPanel className="h-48" />
        <Skeleton className="h-12 w-40 rounded-md" />
      </SectionSkeleton>
      <SectionSkeleton>
        <span aria-hidden className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonPanel key={index} className="h-16" />
          ))}
        </span>
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-64" />
      </SectionSkeleton>
    </LoadingState>
  )
}
