import { useTranslations } from 'next-intl'
import { PageTitle } from '@/shared/components/page-title'
import {
  LinesSkeleton,
  LoadingState,
  SectionSkeleton,
  Skeleton,
  SkeletonPanel,
} from '@/shared/components/skeleton'

export default function SharingTermsLoading() {
  const t = useTranslations('care.terms')

  return (
    <LoadingState className="space-y-10">
      <PageTitle kicker={<Skeleton className="my-[3px] h-3.5 w-36" />} title={t('title')} />
      <SkeletonPanel className="h-24" />
      <SectionSkeleton>
        <LinesSkeleton widths={['w-full', 'w-4/5']} />
      </SectionSkeleton>
      <SkeletonPanel className="h-40" />
    </LoadingState>
  )
}
