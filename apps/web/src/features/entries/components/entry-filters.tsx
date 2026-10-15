'use client'

import { activeFilterCount, checkInSearchLength } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId, useRef, useState, type SubmitEvent } from 'react'
import { CloseIcon, FilterIcon, SearchIcon } from '@/shared/components/icons'
import { PopoverPanel } from '@/shared/components/popover-panel'
import { Sheet } from '@/shared/components/sheet'
import { useMediaQuery } from '@/shared/hooks/use-media-query'
import { cn } from '@/shared/lib/utils'
import { noFilters, selectionOf, type EntryFilters as Filters } from '../filters'
import { useFilterSummary } from '../use-filter-summary'
import { FilterPanel } from './filter-panel'

export type FilterChange = 'push' | 'replace'

interface EntryFiltersProps {
  filters: Filters
  customEmotions: readonly string[]
  customContexts: readonly string[]
  total: number
  onChange: (filters: Filters, change: FilterChange) => void
}

const iconButton =
  'absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground'

export function EntryFilters({
  filters,
  customEmotions,
  customContexts,
  total,
  onChange,
}: EntryFiltersProps) {
  const t = useTranslations('entries')
  const desktop = useMediaQuery('(min-width: 640px)')
  const trigger = useRef<HTMLButtonElement>(null)
  const changed = useRef(false)
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const count = activeFilterCount(selectionOf(filters))
  const summary = useFilterSummary(filters)

  function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('q')
    onChange({ ...filters, q: typeof value === 'string' ? value.trim() : '' }, 'push')
  }

  function openPanel() {
    changed.current = false
    setOpen(true)
  }

  function close(returnFocus: boolean) {
    setOpen(false)
    if (returnFocus) {
      trigger.current?.focus()
    }
  }

  function change(next: Filters) {
    onChange(next, changed.current ? 'replace' : 'push')
    changed.current = true
  }

  return (
    <div className="space-y-3">
      <div className="relative flex gap-2">
        <form role="search" onSubmit={search} className="relative min-w-0 flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            key={filters.q}
            type="search"
            name="q"
            defaultValue={filters.q}
            maxLength={checkInSearchLength}
            enterKeyHint="search"
            aria-label={t('search.label')}
            placeholder={t('search.placeholder')}
            className="h-11 w-full rounded-md border border-rule bg-background pr-12 pl-11 text-base outline-none placeholder:text-muted-foreground focus:border-foreground [&::-webkit-search-cancel-button]:hidden"
          />
          <button type="submit" className="sr-only">
            {t('search.submit')}
          </button>
          {filters.q !== '' && (
            <button
              type="button"
              aria-label={t('search.clear')}
              onClick={() => {
                onChange({ ...filters, q: '' }, 'push')
              }}
              className={`${iconButton} right-1 hover:text-foreground`}
            >
              <CloseIcon className="size-5" />
            </button>
          )}
        </form>
        <button
          ref={trigger}
          type="button"
          aria-label={`${t('filters.open')}, ${t('filters.active', { count })}`}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open && desktop ? panelId : undefined}
          onClick={() => {
            if (open) {
              close(false)
            } else {
              openPanel()
            }
          }}
          className={cn(
            'inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-rule px-3.5 text-[15px] transition-colors duration-150 hover:bg-surface motion-reduce:transition-none',
            count > 0 && 'border-foreground/40',
          )}
        >
          <FilterIcon className="size-5" />
          {t('filters.open')}
          {count > 0 && (
            <span
              aria-hidden
              className="grid h-5 min-w-5 place-items-center rounded-[4px] bg-foreground px-1 text-xs font-medium text-background tabular-nums"
            >
              {count}
            </span>
          )}
        </button>
        {open && desktop && (
          <PopoverPanel
            id={panelId}
            title={t('filters.title')}
            trigger={trigger}
            onClose={close}
            className="max-h-[min(36rem,calc(100dvh-12rem))] w-[26rem] pt-5"
          >
            <FilterPanel
              filters={filters}
              customEmotions={customEmotions}
              customContexts={customContexts}
              total={total}
              onChange={change}
              onDone={() => {
                close(true)
              }}
            />
          </PopoverPanel>
        )}
      </div>
      {open && !desktop && (
        <Sheet
          title={t('filters.title')}
          closeLabel={t('filters.close')}
          onClose={() => {
            setOpen(false)
          }}
        >
          {(closeSheet) => (
            <FilterPanel
              filters={filters}
              customEmotions={customEmotions}
              customContexts={customContexts}
              total={total}
              onChange={change}
              onDone={closeSheet}
            />
          )}
        </Sheet>
      )}
      {summary.length > 0 && (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            <span className="sr-only">{t('filters.summary')}: </span>
            {summary.join(' · ')}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange({ ...noFilters, q: filters.q }, 'push')
            }}
            className="cursor-pointer text-foreground underline decoration-1 underline-offset-4"
          >
            {t('filters.clear')}
          </button>
        </p>
      )}
    </div>
  )
}
