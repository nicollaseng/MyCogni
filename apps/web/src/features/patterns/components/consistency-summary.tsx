import type { Consistency } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { cn } from '@/shared/lib/utils'

interface ConsistencySummaryProps {
  consistency: Consistency
  recordedDays: readonly boolean[]
}

export function ConsistencySummary({ consistency, recordedDays }: ConsistencySummaryProps) {
  const t = useTranslations('patterns.consistency')
  const { recordedDays: count, days, currentStreak } = consistency

  return (
    <Section title={t('title')}>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 pt-1">
        <div className="flex flex-col gap-1">
          <dt className="grow text-sm text-pretty text-muted-foreground">
            {t('recorded', { days })}
          </dt>
          <dd className="text-[28px] leading-tight font-medium tracking-[-0.01em]">
            {t('recordedValue', { count, days })}
          </dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="grow text-sm text-muted-foreground">{t('streak')}</dt>
          <dd className="text-[28px] leading-tight font-medium tracking-[-0.01em]">
            {t('streakValue', { count: currentStreak })}
          </dd>
        </div>
      </dl>
      <div
        role="img"
        aria-label={t('stripLabel', { count, days })}
        className="grid gap-[3px] pt-2"
        style={{ gridTemplateColumns: `repeat(${String(recordedDays.length)}, minmax(0, 1fr))` }}
      >
        {recordedDays.map((recorded, index) => (
          <span
            key={index}
            data-recorded={recorded}
            className={cn('h-2.5 rounded-xs', recorded ? 'bg-emphasis' : 'bg-foreground/10')}
          />
        ))}
      </div>
    </Section>
  )
}
