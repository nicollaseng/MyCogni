import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { formatDayMonth } from '@/shared/lib/time'
import { daysSince, isScreeningDue, nextScreeningDate } from '../due'

interface ScreeningScheduleProps {
  lastAnswer: string
  now: Date
  timeZone: string
  offerRetake: 'always' | 'whenDue'
}

export function ScreeningSchedule({
  lastAnswer,
  now,
  timeZone,
  offerRetake,
}: ScreeningScheduleProps) {
  const t = useTranslations('screening.latest')
  const locale = useLocale()
  const due = isScreeningDue(lastAnswer, now)

  return (
    <div className="space-y-2">
      <p className="text-sm text-pretty text-muted-foreground">
        {due
          ? t('due', { count: daysSince(lastAnswer, now) })
          : t('next', { date: formatDayMonth(nextScreeningDate(lastAnswer), timeZone, locale) })}
      </p>
      {(due || offerRetake === 'always') && (
        <Link
          href="/questionnaires"
          className="inline-block underline decoration-1 underline-offset-4"
        >
          {t('retake')}
        </Link>
      )}
    </div>
  )
}
