import type { JournalShare } from '@mycogni/contracts'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { bookHref } from '@/features/mybook/book-href'
import { RefreshAfterPageVisit } from '@/features/mybook/components/book-freshness'
import { Icon } from '@/features/mybook/components/icon'
import { NewPageButton } from '@/features/mybook/components/new-page-button'
import { PageList } from '@/features/mybook/components/page-list'
import { PageSearch } from '@/features/mybook/components/page-search'
import { groupByMonth } from '@/features/mybook/months'
import { isLive } from '@/features/mybook/sharing'
import { ListPager } from '@/shared/components/list-pager'
import { fetchJournal, fetchJournalShares } from '@/shared/lib/api/journal'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { listPageOf } from '@/shared/lib/list-page'
import { guarded } from '@/shared/lib/settled'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('mybook.meta')
  return { title: t('title') }
}

function sharedWith(shares: readonly JournalShare[], now: Date): string[] {
  return [
    ...new Set(
      shares.filter((share) => isLive(share, now)).map((share) => share.professional.name),
    ),
  ]
}

async function bookOf(searchParams: PageProps<'/mybook'>['searchParams']) {
  const params = await searchParams
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : ''
  const { page, size } = listPageOf(params)
  const [book, shares, t, locale] = await Promise.all([
    fetchJournal({ q: query, page, size }),
    fetchJournalShares(),
    getTranslations('mybook.list'),
    getLocale(),
  ])
  return { query, size, book, shares, t, locale }
}

export default async function MybookPage({ searchParams }: PageProps<'/mybook'>) {
  const [{ timezone }, { query, size, book, shares, t, locale }] = await guarded(
    requireOnboardedProfile(),
    bookOf(searchParams),
  )
  const now = new Date()
  const names = sharedWith(shares, now)
  const blankBook = book.total === 0 && query === ''

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
          <PageSearch query={query} size={size} />
          {book.items.length === 0 ? (
            <p className="px-1 text-muted-foreground">{t('noResults', { query })}</p>
          ) : (
            <PageList
              groups={groupByMonth(book.items, timezone)}
              now={now}
              timeZone={timezone}
              hrefOf={(id) => `/mybook/${id}`}
            />
          )}
          <ListPager
            page={book.page}
            size={size}
            total={book.total}
            hrefOf={(target) => bookHref(query, target)}
          />
        </div>
      )}
    </>
  )
}
