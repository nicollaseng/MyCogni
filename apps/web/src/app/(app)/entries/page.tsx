import { contextIds, emotionIds, frequentTags, isContextId, isEmotionId } from '@mycogni/domain'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { EntriesBrowser } from '@/features/entries/components/entries-browser'
import { EntryList } from '@/features/entries/components/entry-list'
import {
  checkInFilterOf,
  entriesHref,
  isFiltered,
  noFilters,
  parseEntryFilters,
} from '@/features/entries/filters'
import { groupByDay } from '@/features/entries/group-by-day'
import { matchingTags } from '@/features/entries/search'
import { ReportExport } from '@/features/reports/components/report-export'
import { ListPager } from '@/shared/components/list-pager'
import { PageTitle } from '@/shared/components/page-title'
import { fetchCheckInPage, fetchCheckIns, fetchInsights } from '@/shared/lib/api/resources'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { listPageOf } from '@/shared/lib/list-page'
import { guarded } from '@/shared/lib/settled'
import { buttonVariants } from '@/shared/ui/button'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('entries.meta')
  return { title: t('title') }
}

const recentForTags = 200
const usedTags = 12

const footLink = 'text-sm underline decoration-1 underline-offset-4'

async function entriesOf(searchParams: PageProps<'/entries'>['searchParams']) {
  const [t, catalog, params] = await Promise.all([
    getTranslations('entries'),
    getTranslations('checkIn'),
    searchParams,
  ])
  const filters = parseEntryFilters(params)
  const qTags = matchingTags(filters.q, [
    ...emotionIds.map((id) => ({ id, label: catalog(`emotions.${id}`) })),
    ...contextIds.map((id) => ({ id, label: catalog(`contexts.${id}`) })),
  ])
  const filter = checkInFilterOf(filters, { now: new Date(), qTags })
  const { size, page } = listPageOf(params)
  const [found, recent, readings] = await Promise.all([
    fetchCheckInPage({ ...filter, page, size }),
    fetchCheckIns({ limit: recentForTags }),
    fetchInsights(),
  ])
  return { t, filters, found, size, recent, readings }
}

export default async function EntriesPage({ searchParams }: PageProps<'/entries'>) {
  const [{ timezone }, { t, filters, found, size, recent, readings }] = await guarded(
    requireOnboardedProfile(),
    entriesOf(searchParams),
  )
  const filtered = isFiltered(filters)
  const { items: checkIns, total, page } = found

  return (
    <>
      <PageTitle
        title={t('title')}
        description={t('description')}
        action={
          recent.length > 0 ? (
            <ReportExport
              href="/patterns/report"
              audience="patient"
              summaries={readings.length > 0}
            />
          ) : undefined
        }
      />
      {recent.length === 0 ? (
        <div className="space-y-5">
          <p className="text-muted-foreground">{t('empty')}</p>
          <Link href="/check-in" className={buttonVariants()}>
            {t('emptyAction')}
          </Link>
        </div>
      ) : (
        <EntriesBrowser
          filters={filters}
          total={total}
          size={size}
          customEmotions={frequentTags(
            recent.map((checkIn) => checkIn.emotions),
            usedTags,
          )
            .map((item) => item.tag)
            .filter((tag) => !isEmotionId(tag))}
          customContexts={frequentTags(
            recent.map((checkIn) => checkIn.contexts),
            usedTags,
          )
            .map((item) => item.tag)
            .filter((tag) => !isContextId(tag))}
        >
          <p role="status" className="text-sm text-muted-foreground">
            {filtered
              ? t('results.filtered', { count: total })
              : t('results.all', { count: total })}
          </p>
          {checkIns.length === 0 ? (
            <div className="space-y-3">
              <p className="max-w-md text-pretty text-muted-foreground">{t('results.none')}</p>
              <Link href={entriesHref(noFilters, { page: 1, size })} className={footLink}>
                {t('results.reset')}
              </Link>
            </div>
          ) : (
            <EntryList
              groups={groupByDay(checkIns, { timeZone: timezone, now: new Date() })}
              timeZone={timezone}
              filters={filters}
              listPage={{ page, size }}
            />
          )}
          <ListPager
            page={page}
            size={size}
            total={total}
            hrefOf={(target) => entriesHref(filters, target)}
          />
        </EntriesBrowser>
      )}
    </>
  )
}
