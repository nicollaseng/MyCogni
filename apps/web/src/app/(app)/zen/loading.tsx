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
      <div className="space-y-4">
        <div className="on-zen rounded-lg bg-zen px-6 pt-5 pb-8 sm:px-9 sm:pt-7 sm:pb-11">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] sm:text-[32px]">
              {t('title')}
            </h1>
            <Skeleton className="h-10 w-36 rounded-md bg-zen-foreground/15" />
          </div>
          <span aria-hidden className="mt-12 block max-w-[28rem] space-y-4 sm:mt-16">
            <Skeleton className="h-3.5 w-20 bg-zen-foreground/15" />
            <Skeleton className="h-4 w-52 bg-zen-foreground/15" />
            <Skeleton className="h-9 w-64 bg-zen-foreground/15 sm:h-11" />
            <Skeleton className="h-4 w-28 bg-zen-foreground/15" />
            <Skeleton className="mt-6 h-12 w-32 rounded-md bg-zen-foreground/15" />
          </span>
        </div>
        <SkeletonPanel className="h-24 sm:w-[22rem]" />
      </div>
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
