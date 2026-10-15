'use client'

import { checkInSearchLength, contextGroups, emotionFamilies } from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import type { SubmitEvent } from 'react'
import type { ChoiceGroup } from '@/features/check-in/catalog'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { CloseIcon, SearchIcon } from '@/shared/components/icons'
import {
  isFiltered,
  isMoodRange,
  isPeriod,
  moodRangeIds,
  noFilters,
  periods,
  type EntryFilters as Filters,
} from '../filters'
import { FilterSelect, type SelectGroup, type SelectOption } from './filter-select'

const periodKeys = { '7': 'week', '30': 'month', '90': 'quarter' } as const

interface EntryFiltersProps {
  filters: Filters
  usedEmotions: readonly string[]
  usedContexts: readonly string[]
  onChange: (filters: Filters) => void
}

function tagGroups(
  usedLabel: string,
  used: readonly string[],
  selected: string | null,
  labelOf: (tag: string) => string,
  catalog: readonly ChoiceGroup[],
): SelectGroup[] {
  const yours = selected === null || used.includes(selected) ? used : [selected, ...used]
  return [
    { label: usedLabel, options: yours.map((tag) => ({ value: tag, label: labelOf(tag) })) },
    ...catalog.map((group) => ({
      label: group.title,
      options: group.items.map((item) => ({ value: item.id, label: item.label })),
    })),
  ]
}

const iconButton =
  'absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground'

export function EntryFilters({ filters, usedEmotions, usedContexts, onChange }: EntryFiltersProps) {
  const t = useTranslations('entries')
  const labels = useCatalogLabels()
  const anyOption = (label: string): SelectOption => ({ value: '', label })

  function search(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = new FormData(event.currentTarget).get('q')
    onChange({ ...filters, q: typeof value === 'string' ? value.trim() : '' })
  }

  return (
    <div className="space-y-4">
      <form role="search" onSubmit={search} className="relative">
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
              onChange({ ...filters, q: '' })
            }}
            className={`${iconButton} right-1 hover:text-foreground`}
          >
            <CloseIcon className="size-5" />
          </button>
        )}
      </form>

      <fieldset className="space-y-3">
        <legend className="sr-only">{t('filters.label')}</legend>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <FilterSelect
            label={t('filters.period.label')}
            value={filters.period ?? ''}
            options={[
              anyOption(t('filters.period.any')),
              ...periods.map((period) => ({
                value: period,
                label: t(`filters.period.${periodKeys[period]}`),
              })),
            ]}
            onChange={(value) => {
              onChange({ ...filters, period: isPeriod(value) ? value : null })
            }}
          />
          <FilterSelect
            label={t('filters.mood.label')}
            value={filters.mood ?? ''}
            options={[
              anyOption(t('filters.mood.any')),
              ...moodRangeIds.map((range) => ({ value: range, label: t(`filters.mood.${range}`) })),
            ]}
            onChange={(value) => {
              onChange({ ...filters, mood: isMoodRange(value) ? value : null })
            }}
          />
          <FilterSelect
            label={t('filters.emotion.label')}
            value={filters.emotion ?? ''}
            options={[anyOption(t('filters.emotion.any'))]}
            groups={tagGroups(
              t('filters.emotion.used'),
              usedEmotions,
              filters.emotion,
              labels.emotion,
              labels.emotionChoices(emotionFamilies),
            )}
            onChange={(value) => {
              onChange({ ...filters, emotion: value === '' ? null : value })
            }}
          />
          <FilterSelect
            label={t('filters.context.label')}
            value={filters.context ?? ''}
            options={[anyOption(t('filters.context.any'))]}
            groups={tagGroups(
              t('filters.context.used'),
              usedContexts,
              filters.context,
              labels.context,
              labels.contextChoices(contextGroups),
            )}
            onChange={(value) => {
              onChange({ ...filters, context: value === '' ? null : value })
            }}
          />
        </div>
        <div className="flex min-h-9 items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 px-0.5 text-[15px]">
            <input
              type="checkbox"
              checked={filters.withNote}
              onChange={(event) => {
                onChange({ ...filters, withNote: event.currentTarget.checked })
              }}
              className="size-[18px] cursor-pointer accent-primary"
            />
            {t('filters.withNote')}
          </label>
          {isFiltered({ ...filters, q: '' }) && (
            <button
              type="button"
              onClick={() => {
                onChange({ ...noFilters, q: filters.q })
              }}
              className="text-sm underline decoration-1 underline-offset-4"
            >
              {t('filters.clear')}
            </button>
          )}
        </div>
      </fieldset>
    </div>
  )
}
