import type { JournalEntrySummary } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Section } from '@/shared/components/section'
import { formatMonth, formatPageDate } from '../dates'
import type { MonthGroup } from '../months'
import { Icon } from './icon'

export type PageHref = `/mybook/${string}` | `/pro/patients/${string}/mybook/${string}`

interface PageListProps {
  groups: readonly MonthGroup[]
  now: Date
  timeZone: string
  hrefOf: (id: string) => PageHref
}

function PageRow({
  page,
  href,
  now,
  timeZone,
}: {
  page: JournalEntrySummary
  href: PageHref
  now: Date
  timeZone: string
}) {
  const t = useTranslations('mybook')
  const locale = useLocale()

  return (
    <li>
      <Link
        href={href}
        className="block rounded-[6px] px-3 py-3 transition-colors duration-150 hover:bg-surface focus-visible:bg-surface motion-reduce:transition-none"
      >
        <span className="block truncate font-serif text-[19px] leading-snug">
          {page.title ?? t('untitled')}
        </span>
        <span className="mt-1 flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground">
          <time dateTime={page.updatedAt} className="shrink-0 text-foreground/80">
            {formatPageDate(new Date(page.updatedAt), now, timeZone, locale)}
          </time>
          {page.imageCount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1">
              <Icon name="image" className="size-4" />
              <span aria-hidden>{page.imageCount}</span>
              <span className="sr-only">{t('photos', { count: page.imageCount })}</span>
            </span>
          )}
          <span className="truncate">{page.excerpt === '' ? t('list.blank') : page.excerpt}</span>
        </span>
      </Link>
    </li>
  )
}

export function PageList({ groups, now, timeZone, hrefOf }: PageListProps) {
  const locale = useLocale()

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <Section key={group.key} title={formatMonth(group.date, now, timeZone, locale)}>
          <ul className="-mx-3 space-y-1">
            {group.pages.map((page) => (
              <PageRow
                key={page.id}
                page={page}
                href={hrefOf(page.id)}
                now={now}
                timeZone={timeZone}
              />
            ))}
          </ul>
        </Section>
      ))}
    </div>
  )
}
