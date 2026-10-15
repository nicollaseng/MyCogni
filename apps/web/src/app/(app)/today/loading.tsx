import { useTranslations } from 'next-intl'
import { TodayIntro } from '@/features/check-in/components/today-intro'
import { PageTitle } from '@/shared/components/page-title'
import {
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function TodayLoading() {
  const t = useTranslations('today')

  return (
    <LoadingState className="space-y-10">
      <PageTitle kicker={<Skeleton className="my-[3px] h-3.5 w-44" />} title={t('title')} />
      <TodayIntro />
      <SectionSkeleton>
        <Skeleton className="h-5 w-4/5 max-w-md" />
        <SkeletonPanel className="h-44" />
      </SectionSkeleton>
      <SectionSkeleton>
        <SkeletonPanel className="h-32" />
      </SectionSkeleton>
    </LoadingState>
  )
}
