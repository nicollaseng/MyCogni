'use client'

import { useTranslations } from 'next-intl'
import type { Page } from '../pagination'
import { BackIcon } from './icons'

interface PagerProps<T> {
  label: string
  page: Page<T>
  onPage: (page: number) => void
}

const pagerButton =
  'grid size-9 place-items-center rounded-[6px] text-foreground transition-colors hover:bg-foreground/[0.06] disabled:pointer-events-none disabled:opacity-35'

export function Pager<T>({ label, page, onPage }: PagerProps<T>) {
  const t = useTranslations('professional.pager')
  if (page.pageCount <= 1) {
    return null
  }
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3 pt-1">
      <p className="text-sm text-muted-foreground tabular-nums">
        {t('range', { from: page.from, to: page.to, total: page.total })}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('previous')}
          disabled={page.page === 1}
          onClick={() => {
            onPage(page.page - 1)
          }}
          className={pagerButton}
        >
          <BackIcon className="size-4" />
        </button>
        <span className="min-w-12 text-center text-sm tabular-nums">
          {t('page', { page: page.page, count: page.pageCount })}
        </span>
        <button
          type="button"
          aria-label={t('next')}
          disabled={page.page === page.pageCount}
          onClick={() => {
            onPage(page.page + 1)
          }}
          className={pagerButton}
        >
          <BackIcon className="size-4 rotate-180" />
        </button>
      </div>
    </nav>
  )
}
