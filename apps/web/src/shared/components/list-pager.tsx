import { defaultPageSize, pageCountOf, pageSizes, type PageSize } from '@mycogni/domain'
import type { Route } from 'next'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ListPage } from '@/shared/lib/list-page'
import { cn } from '@/shared/lib/utils'
import { pagerStep } from '@/shared/ui/pager'
import { ChevronRightIcon } from './icons'
import { PageSizeSelect } from './page-size-select'

interface ListPagerProps<Href extends string> {
  page: number
  size: PageSize
  total: number
  hrefOf: (target: ListPage) => Route<Href>
}

interface StepProps<Href extends string> {
  label: string
  href: Route<Href> | null
  backwards?: boolean
}

function Step<Href extends string>({ label, href, backwards = false }: StepProps<Href>) {
  const icon = <ChevronRightIcon className={cn('size-4', backwards && 'rotate-180')} />
  return href === null ? (
    <span role="link" aria-disabled="true" aria-label={label} className={pagerStep}>
      {icon}
    </span>
  ) : (
    <Link href={href} aria-label={label} className={pagerStep}>
      {icon}
    </Link>
  )
}

export function ListPager<Href extends string>({
  page,
  size,
  total,
  hrefOf,
}: ListPagerProps<Href>) {
  const t = useTranslations('common.pager')
  const count = pageCountOf(total, size)
  if (total === 0 || (count === 1 && size === defaultPageSize)) {
    return null
  }
  const from = (page - 1) * size + 1
  const to = Math.min(page * size, total)

  return (
    <nav
      aria-label={t('label')}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {from === to ? t('single', { position: from, total }) : t('range', { from, to, total })}
      </p>
      <div className="flex items-center gap-4">
        <PageSizeSelect
          label={t('size')}
          size={size}
          options={pageSizes.map((option) => ({
            size: option,
            href: hrefOf({ page: 1, size: option }),
          }))}
        />
        {count > 1 && (
          <div className="flex items-center gap-1">
            <Step
              label={t('previous')}
              href={page > 1 ? hrefOf({ page: page - 1, size }) : null}
              backwards
            />
            <span aria-current="page" className="min-w-12 text-center text-sm tabular-nums">
              <span aria-hidden>{t('page', { page, count })}</span>
              <span className="sr-only">{t('current', { page, count })}</span>
            </span>
            <Step label={t('next')} href={page < count ? hrefOf({ page: page + 1, size }) : null} />
          </div>
        )}
      </div>
    </nav>
  )
}
