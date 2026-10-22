import type { PracticeDay, PracticeTotals } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { PracticeMap } from './practice-map'

interface PracticeSummaryProps {
  week: PracticeTotals
  days: readonly PracticeDay[]
  practisedDays: number
  weeks: number
}

export function PracticeSummary({ week, days, practisedDays, weeks }: PracticeSummaryProps) {
  const t = useTranslations('zen.practice')
  const empty = practisedDays === 0

  return (
    <section aria-labelledby="zen-practice" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="zen-practice" className="font-serif text-[26px] leading-tight tracking-[-0.01em]">
          {t('title')}
        </h2>
        <Link
          href="/zen/practice"
          className="text-sm text-muted-foreground underline decoration-1 underline-offset-4 hover:text-foreground"
        >
          {t('seeAll')}
        </Link>
      </div>
      <div className="flex flex-col gap-5 rounded-lg bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <dl className="flex gap-8">
          <div>
            <dt className="text-sm text-muted-foreground">{t('weekMinutes')}</dt>
            <dd className="font-serif text-[32px] leading-tight tabular-nums">{week.minutes}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">{t('weekSessions')}</dt>
            <dd className="font-serif text-[32px] leading-tight tabular-nums">{week.sessions}</dd>
          </div>
        </dl>
        <div className="space-y-2">
          <PracticeMap days={days} label={t('mapLabel', { days: practisedDays, weeks })} />
          <p className="text-sm text-muted-foreground">
            {empty ? t('empty') : t('days', { days: practisedDays, weeks })}
          </p>
        </div>
      </div>
    </section>
  )
}
