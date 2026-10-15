'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SearchField } from './search-field'

export function PageSearch({ query }: { query: string }) {
  const t = useTranslations('mybook.list')
  const router = useRouter()

  return (
    <SearchField
      label={t('search')}
      placeholder={t('searchPlaceholder')}
      initial={query}
      onSearch={(value) => {
        router.replace(value === '' ? '/mybook' : `/mybook?q=${encodeURIComponent(value)}`, {
          scroll: false,
        })
      }}
    />
  )
}
