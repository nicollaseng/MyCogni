import type { JournalShare } from '@mycogni/contracts'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { RefreshAfterPageVisit } from '@/features/mybook/components/book-freshness'
import { Icon } from '@/features/mybook/components/icon'
import { NewPageButton } from '@/features/mybook/components/new-page-button'
import { PageList } from '@/features/mybook/components/page-list'
import { PageSearch } from '@/features/mybook/components/page-search'
import { groupByMonth } from '@/features/mybook/months'
import { isLive } from '@/features/mybook/sharing'
import { fetchJournal, fetchJournalShares } from '@/shared/lib/api/journal'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.meta')
  return { title: t('title') }
}

const pageSize = 50

function sharedWith(shares: readonly JournalShare[], now: Date): string[] {
  return [
    ...new Set(
      shares.filter((share) => isLive(share, now)).map((share) => share.professional.name),
    ),
  ]
}

async function bookOf(searchParams: PageProps<'/mybook'>['searchParams']) {
  const { q, before } = await searchParams
  const query = typeof q === 'string' ? q.trim().slice(0, 100) : ''
  const [pages, shares, t, locale] = await Promise.all([
    fetchJournal({
      q: query,
      before: typeof before === 'string' ? before : undefined,
      limit: pageSize,
    }),
    fetchJournalShares(),
    getTranslations('mybook.list'),
    getLocale(),
  ])
  return { query, before, pages, shares, t, locale }
}

export default async function MybookPage({ searchParams }: PageProps<'/mybook'>) {
  const [{ timezone }, { query, before, pages, shares, t, locale }] = await guarded(
    requireOnboardedProfile(),
    bookOf(searchParams),
  )
  const now = new Date()
  const names = sharedWith(shares, now)
  const oldest = pages.at(-1)
  const blankBook = pages.length === 0 && query === '' && before === undefined

  return (
    <>
      <RefreshAfterPageVisit />
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl">
            {t('title')}
          </h1>
          <div className="pt-1 sm:pt-2">
            <NewPageButton label={t('newPage')} />
          </div>
        </div>
        <p className="max-w-[36rem] leading-relaxed text-muted-foreground">{t('description')}</p>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1 text-sm text-muted-foreground">
          <Icon name="lock" className="size-4" />
          <span>
            {names.length === 0
              ? t('privacy.private')
              : t('privacy.shared', {
                  names: new Intl.ListFormat(locale, { type: 'conjunction' }).format(names),
                })}
          </span>
          <Link
            href="/mybook/sharing"
            className="text-foreground underline decoration-1 underline-offset-4"
          >
            {t('privacy.manage')}
          </Link>
        </p>
      </header>

      {blankBook ? (
        <section aria-labelledby="mybook-empty" className="space-y-3 pt-4">
          <h2 id="mybook-empty" className="font-serif text-[26px] leading-tight tracking-[-0.01em]">
            {t('empty.title')}
          </h2>
          <p className="max-w-[30rem] leading-relaxed text-pretty text-muted-foreground">
            {t('empty.body')}
          </p>
          <div className="pt-3">
            <NewPageButton label={t('empty.action')} size="default" />
          </div>
        </section>
      ) : (
        <div className="space-y-8">
          <PageSearch query={query} />
          {pages.length === 0 ? (
            <p className="px-1 text-muted-foreground">{t('noResults', { query })}</p>
          ) : (
            <PageList
              groups={groupByMonth(pages, timezone)}
              now={now}
              timeZone={timezone}
              hrefOf={(id) => `/mybook/${id}`}
            />
          )}
          {pages.length === pageSize && oldest !== undefined && (
            <Link
              href={{
                pathname: '/mybook',
                query:
                  query === ''
                    ? { before: oldest.updatedAt }
                    : { q: query, before: oldest.updatedAt },
              }}
              className="inline-block px-1 text-sm underline decoration-1 underline-offset-4"
            >
              {t('older')}
            </Link>
          )}
        </div>
      )}
    </>
  )
}
