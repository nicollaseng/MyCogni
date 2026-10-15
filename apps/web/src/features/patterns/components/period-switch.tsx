import { patternPeriods, type PatternPeriod } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { segmentedActive, segmentedGroup, segmentedItem } from '@/shared/ui/segmented'

export function PeriodSwitch({ period }: { period: PatternPeriod }) {
  const t = useTranslations('patterns.period')

  return (
    <nav aria-label={t('label')} className={cn(segmentedGroup, 'w-full sm:w-fit')}>
      {patternPeriods.map((option) => (
        <Link
          key={option}
          href={`/patterns?period=${String(option)}`}
          scroll={false}
          aria-current={option === period ? 'page' : undefined}
          className={cn(segmentedItem, 'sm:px-5', option === period && segmentedActive)}
        >
          {t('days', { days: option })}
        </Link>
      ))}
    </nav>
  )
}
