'use client'

import { locales, type Locale } from '@mycogni/domain'
import { useLocale, useTranslations } from 'next-intl'
import { useId, useTransition } from 'react'
import { unlessOutdated } from '@/shared/lib/actions/outdated'
import { cn } from '@/shared/lib/utils'
import { localeNames } from '../locale-names'

interface LocaleSelectProps {
  choose: (locale: Locale) => Promise<void>
  showLabel?: boolean
  className?: string
}

export function LocaleSelect({ choose, showLabel = false, className }: LocaleSelectProps) {
  const t = useTranslations('common.language')
  const current = useLocale()
  const [pending, startTransition] = useTransition()
  const id = useId()

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <label htmlFor={id} className={showLabel ? 'text-[15px]' : 'sr-only'}>
        {t('label')}
      </label>
      <select
        id={id}
        value={current}
        disabled={pending}
        onChange={(event) => {
          const next = locales.find((locale) => locale === event.currentTarget.value)
          if (next !== undefined) {
            startTransition(async () => {
              await unlessOutdated(() => choose(next))
            })
          }
        }}
        className="min-h-11 cursor-pointer rounded-md border border-rule bg-transparent px-4 text-[15px] disabled:opacity-60"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {localeNames[locale]}
          </option>
        ))}
      </select>
    </div>
  )
}
