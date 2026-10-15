import type { JournalEntrySummary } from '@mycogni/contracts'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Panel, Section } from '@/shared/components/section'
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
        className="flex items-center gap-4 rounded-[16px] px-3 py-3 transition-colors duration-150 hover:bg-sage/70 focus-visible:bg-sage/70 motion-reduce:transition-none"
      >
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="block truncate font-serif text-[19px] leading-snug">
            {page.title ?? t('untitled')}
          </span>
          <span className="flex min-w-0 gap-2 text-sm text-muted-foreground">
            <time dateTime={page.updatedAt} className="shrink-0 text-foreground/75">
              {formatPageDate(new Date(page.updatedAt), now, timeZone, locale)}
            </time>
            <span className="truncate">{page.excerpt === '' ? t('list.blank') : page.excerpt}</span>
          </span>
        </span>
        {page.imageCount > 0 && (
          <span className="flex h-12 min-w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-[12px] bg-sage px-2 text-muted-foreground">
            <Icon name="image" className="size-[18px]" />
            <span aria-hidden className="text-[11px] leading-none">
              {page.imageCount}
            </span>
            <span className="sr-only">{t('photos', { count: page.imageCount })}</span>
          </span>
        )}
      </Link>
    </li>
  )
}

export function PageList({ groups, now, timeZone, hrefOf }: PageListProps) {
  const locale = useLocale()

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <Section key={group.key} title={formatMonth(group.date, now, timeZone, locale)}>
          <Panel className="px-2 py-2">
            <ul className="space-y-0.5">
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
          </Panel>
        </Section>
      ))}
    </div>
  )
}
