import type { CheckIn } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { isMoodLevel, moodColor, moodKeyOf, valenceOf } from '@/features/mood/mood-levels'
import type { ListPage } from '@/shared/lib/list-page'
import { formatDayTitle, formatTime } from '@/shared/lib/time'
import { entryHref, noFilters, type EntryFilters } from '../filters'
import type { DayGroup } from '../group-by-day'

interface EntryProps {
  checkIn: CheckIn
  timeZone: string
  filters: EntryFilters
  listPage?: ListPage
}

function Entry({ checkIn, timeZone, filters, listPage }: EntryProps) {
  const t = useTranslations('common.mood')
  const locale = useLocale()
  const labels = useCatalogLabels()
  if (!isMoodLevel(checkIn.moodLevel)) {
    return null
  }
  const tags = [...checkIn.emotions.map(labels.emotion), ...checkIn.contexts.map(labels.context)]
  return (
    <li>
      <Link
        href={entryHref(checkIn.id, filters, listPage)}
        className="-mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1.5 rounded-[6px] px-3 py-2.5 transition-colors duration-150 hover:bg-surface motion-reduce:transition-none sm:grid-cols-[4rem_9.5rem_minmax(0,1fr)]"
      >
        <time
          dateTime={checkIn.recordedAt}
          className="col-start-2 row-start-1 text-right text-sm text-muted-foreground sm:col-start-1 sm:text-left"
        >
          {formatTime(new Date(checkIn.recordedAt), timeZone, locale)}
        </time>
        <span className="col-start-1 row-start-1 flex items-center gap-2.5 sm:col-start-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: moodColor(valenceOf(checkIn.moodLevel)) }}
          />
          {t(moodKeyOf(checkIn.moodLevel))}
        </span>
        {tags.length > 0 && (
          <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1 sm:col-start-3 sm:row-start-1">
            {tags.join(' · ')}
          </span>
        )}
        {checkIn.note !== null && (
          <span className="col-span-2 line-clamp-3 font-serif text-[17px] leading-relaxed text-pretty sm:col-span-1 sm:col-start-3">
            {checkIn.note}
          </span>
        )}
      </Link>
    </li>
  )
}

interface EntryListProps {
  groups: readonly DayGroup[]
  timeZone: string
  filters?: EntryFilters
  listPage?: ListPage
}

export function EntryList({ groups, timeZone, filters = noFilters, listPage }: EntryListProps) {
  const t = useTranslations('entries.days')
  const locale = useLocale()

  return (
    <div className="space-y-8">
      {groups.map((group) => {
        const title =
          group.day === 'earlier' ? formatDayTitle(group.date, timeZone, locale) : t(group.day)
        return (
          <section key={group.key} aria-label={title} className="space-y-2">
            <h2 className="text-sm font-medium">{title}</h2>
            <ol className="space-y-1">
              {group.checkIns.map((checkIn) => (
                <Entry
                  key={checkIn.id}
                  checkIn={checkIn}
                  timeZone={timeZone}
                  filters={filters}
                  listPage={listPage}
                />
              ))}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
