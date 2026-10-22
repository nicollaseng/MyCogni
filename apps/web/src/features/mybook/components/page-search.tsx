'use client'

import type { PageSize } from '@mycogni/domain'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { bookHref } from '../book-href'
import { SearchField } from './search-field'

export function PageSearch({ query, size }: { query: string; size: PageSize }) {
  const t = useTranslations('mybook.list')
  const router = useRouter()

  return (
    <SearchField
      label={t('search')}
      placeholder={t('searchPlaceholder')}
      initial={query}
      onSearch={(value) => {
        router.replace(bookHref(value, { page: 1, size }), { scroll: false })
      }}
    />
  )
}
