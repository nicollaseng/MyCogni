import type { JournalShare } from '@mycogni/contracts'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createPage } from '@/features/mybook/actions'
import { Icon } from '@/features/mybook/components/icon'
import { NewPageButton } from '@/features/mybook/components/new-page-button'
import { PageList } from '@/features/mybook/components/page-list'
import { PageSearch } from '@/features/mybook/components/page-search'
import { groupByMonth } from '@/features/mybook/months'
import { isLive } from '@/features/mybook/sharing'
import { Panel } from '@/shared/components/section'
import { fetchJournal, fetchJournalShares } from '@/shared/lib/api/journal'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

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

export default async function MybookPage({ searchParams }: PageProps<'/mybook'>) {
  const { timezone } = await requireOnboardedProfile()
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
  const now = new Date()
  const names = sharedWith(shares, now)
  const oldest = pages.at(-1)
  const blankBook = pages.length === 0 && query === '' && before === undefined

  return (
    <>
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl">
            {t('title')}
          </h1>
          <div className="pt-1 sm:pt-2">
            <NewPageButton create={createPage} label={t('newPage')} />
          </div>
        </div>
        <p className="max-w-[36rem] leading-relaxed text-muted-foreground">{t('description')}</p>
      </header>

      <Link
        href="/mybook/sharing"
        className="flex items-center gap-3.5 rounded-[18px] bg-surface px-4 py-3.5 transition-colors duration-150 hover:bg-sage motion-reduce:transition-none"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-background/70 text-muted-foreground">
          <Icon name="lock" className="size-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] leading-snug">
            {names.length === 0
              ? t('privacy.private')
              : t('privacy.shared', {
                  names: new Intl.ListFormat(locale, { type: 'conjunction' }).format(names),
                })}
          </span>
          <span className="block text-sm text-muted-foreground">{t('privacy.manage')}</span>
        </span>
        <Icon name="forward" className="size-[18px] text-muted-foreground" />
      </Link>

      {blankBook ? (
        <Panel className="space-y-4 px-6 py-8 text-center sm:py-10">
          <p className="font-serif text-[26px] leading-tight tracking-[-0.01em]">
            {t('empty.title')}
          </p>
          <p className="mx-auto max-w-[28rem] leading-relaxed text-pretty text-muted-foreground">
            {t('empty.body')}
          </p>
          <div className="flex justify-center pt-2">
            <NewPageButton create={createPage} label={t('empty.action')} size="default" />
          </div>
        </Panel>
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
