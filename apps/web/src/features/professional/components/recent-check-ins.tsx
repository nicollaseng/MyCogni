import type { RecentCheckIn } from '@mycogni/contracts'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { isMoodLevel, moodKeyOf } from '@/features/mood/mood-levels'
import { MoodDot, RelativeTime } from './patient-cells'
import { Quiet } from './workspace'

interface RecentCheckInsProps {
  entries: readonly RecentCheckIn[]
  now: Date
  timeZone: string
}

export function RecentCheckIns({ entries, now, timeZone }: RecentCheckInsProps) {
  const t = useTranslations('professional')
  const mood = useTranslations('common.mood')
  const labels = useCatalogLabels()

  if (entries.length === 0) {
    return <Quiet>{t('overview.recent.empty')}</Quiet>
  }

  return (
    <ol className="rounded-[8px] bg-surface py-1.5">
      {entries.map((entry) => {
        const tags = [
          entry.emotions.map(labels.emotion).join(', '),
          entry.contexts.map(labels.context).join(', '),
        ].filter((group) => group !== '')
        return (
          <li
            key={`${entry.patientId}-${entry.recordedAt}`}
            className="relative flex gap-3 px-4 py-2.5 transition-colors hover:bg-sage"
          >
            <MoodDot value={entry.moodLevel} className="mt-[7px]" />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <Link
                  href={`/pro/patients/${entry.patientId}`}
                  className="truncate font-medium after:absolute after:inset-0"
                >
                  {entry.name ?? t('patients.unnamed')}
                </Link>
                <span className="shrink-0 text-sm text-muted-foreground">
                  <RelativeTime date={entry.recordedAt} now={now} timeZone={timeZone} />
                </span>
              </div>
              <p className="text-sm leading-snug">
                {isMoodLevel(entry.moodLevel) && mood(moodKeyOf(entry.moodLevel))}
                {tags.length > 0 && (
                  <span className="text-muted-foreground"> · {tags.join(' · ')}</span>
                )}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
