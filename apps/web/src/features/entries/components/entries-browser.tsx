'use client'

import type { PageSize } from '@mycogni/domain'
import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition, type ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { entriesHref, type EntryFilters as Filters } from '../filters'
import { EntryFilters } from './entry-filters'

interface EntriesBrowserProps {
  filters: Filters
  customEmotions: readonly string[]
  customContexts: readonly string[]
  total: number
  size: PageSize
  children: ReactNode
}

export function EntriesBrowser({
  filters,
  customEmotions,
  customContexts,
  total,
  size,
  children,
}: EntriesBrowserProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [shown, showFilters] = useOptimistic(filters)

  return (
    <div className="space-y-6">
      <EntryFilters
        filters={shown}
        customEmotions={customEmotions}
        customContexts={customContexts}
        total={total}
        onChange={(next, change) => {
          startTransition(() => {
            showFilters(next)
            const href = entriesHref(next, { page: 1, size })
            if (change === 'push') {
              router.push(href, { scroll: false })
            } else {
              router.replace(href, { scroll: false })
            }
          })
        }}
      />
      <div
        aria-busy={pending}
        className={cn(
          'space-y-8 transition-opacity duration-200 motion-reduce:transition-none',
          pending && 'opacity-60',
        )}
      >
        {children}
      </div>
    </div>
  )
}
