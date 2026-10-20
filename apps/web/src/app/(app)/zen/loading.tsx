import { useTranslations } from 'next-intl'
import {
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function ZenLoading() {
  const t = useTranslations('zen')

  return (
    <LoadingState className="space-y-14">
      <div className="-mt-4 flex min-h-[16rem] items-end pb-2 sm:-mt-6 sm:min-h-[20rem]">
        <div className="space-y-6">
          <h1 className="font-serif text-[56px] leading-[0.95] tracking-[-0.03em] sm:text-[72px]">
            {t('title')}
          </h1>
          <Skeleton className="h-11 w-40 rounded-md" />
        </div>
      </div>
      <SectionSkeleton>
        <SkeletonPanel className="h-60" />
        <SkeletonPanel className="h-24 sm:w-[22rem]" />
      </SectionSkeleton>
      <SectionSkeleton>
        <span aria-hidden className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonPanel key={index} className="h-28" />
          ))}
        </span>
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-64" />
      </SectionSkeleton>
    </LoadingState>
  )
}
