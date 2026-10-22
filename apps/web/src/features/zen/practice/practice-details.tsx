import type { PracticeKind } from '@mycogni/domain'
import { useFormatter, useTranslations } from 'next-intl'
import { moodColor, moodKeyOf, valenceOf, type MoodLevel } from '@/features/mood/mood-levels'

export interface PracticeItem {
  key: string
  kind: PracticeKind
  title: string
  minutes: number
  sessions?: number
  startedAt?: string
  feelingAfter?: MoodLevel | null
}

export function PracticeUses({ items }: { items: readonly PracticeItem[] }) {
  const t = useTranslations('zen.practice')

  return (
    <section aria-labelledby="practice-uses" className="space-y-3">
      <h2 id="practice-uses" className="text-[15px] font-medium">
        {t('mostUsed')}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-baseline justify-between gap-4 rounded-lg bg-surface px-4 py-3"
          >
            <span className="min-w-0">
              <span className="block text-sm text-muted-foreground">{t(`kinds.${item.kind}`)}</span>
              <span className="block text-pretty">{item.title}</span>
            </span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {t('uses', { sessions: item.sessions ?? 0, minutes: item.minutes })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function RecentPractice({
  items,
  timeZone,
}: {
  items: readonly PracticeItem[]
  timeZone: string
}) {
  const t = useTranslations('zen.practice')
  const mood = useTranslations('common.mood')
  const format = useFormatter()

  return (
    <section aria-labelledby="practice-recent" className="space-y-3">
      <h2 id="practice-recent" className="text-[15px] font-medium">
        {t('recent')}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-4 rounded-lg bg-surface px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted-foreground">
                {t(`kinds.${item.kind}`)}
                {item.startedAt !== undefined &&
                  ` · ${format.dateTime(new Date(item.startedAt), { day: 'numeric', month: 'short', timeZone })}`}
              </span>
              <span className="block text-pretty">{item.title}</span>
            </span>
            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
              {t('minutes', { minutes: item.minutes })}
            </span>
            {item.feelingAfter === null || item.feelingAfter === undefined ? (
              <span aria-hidden className="size-3 shrink-0" />
            ) : (
              <span
                role="img"
                aria-label={t('feltAfter', { mood: mood(moodKeyOf(item.feelingAfter)) })}
                title={mood(moodKeyOf(item.feelingAfter))}
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: moodColor(valenceOf(item.feelingAfter)) }}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
