'use client'

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
  children: ReactNode
}

export function EntriesBrowser({
  filters,
  customEmotions,
  customContexts,
  total,
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
            if (change === 'push') {
              router.push(entriesHref(next), { scroll: false })
            } else {
              router.replace(entriesHref(next), { scroll: false })
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
