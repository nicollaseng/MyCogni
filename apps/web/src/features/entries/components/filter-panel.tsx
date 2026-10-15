'use client'

import {
  activeFilterCount,
  checkInLimits,
  contextGroups,
  emotionFamilies,
  isContextId,
  isEmotionId,
} from '@mycogni/domain'
import { useTranslations } from 'next-intl'
import { useId } from 'react'
import type { ChoiceGroup } from '@/features/check-in/catalog'
import { useCatalogLabels } from '@/features/check-in/use-catalog-labels'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { segmentedActive, segmentedGroup, segmentedItem } from '@/shared/ui/segmented'
import { isPeriod, noFilters, periods, selectionOf, type EntryFilters as Filters } from '../filters'
import { MoodScale } from './mood-scale'
import { TagChecklist } from './tag-checklist'

interface FilterPanelProps {
  filters: Filters
  customEmotions: readonly string[]
  customContexts: readonly string[]
  total: number
  onChange: (filters: Filters) => void
  onDone: () => void
}

function ownGroup(
  title: string,
  custom: readonly string[],
  selected: readonly string[],
  inCatalog: (tag: string) => boolean,
): ChoiceGroup[] {
  const tags = [...new Set([...selected.filter((tag) => !inCatalog(tag)), ...custom])]
  return tags.length === 0
    ? []
    : [{ id: 'yours', title, items: tags.map((tag) => ({ id: tag, label: tag })) }]
}

export function FilterPanel({
  filters,
  customEmotions,
  customContexts,
  total,
  onChange,
  onDone,
}: FilterPanelProps) {
  const t = useTranslations('entries.filters')
  const labels = useCatalogLabels()
  const periodName = useId()
  const moodHeading = useId()
  const canAddMore = filters.emotions.length + filters.contexts.length < checkInLimits.tags
  const active = activeFilterCount(selectionOf(filters))
  const periodOptions = [
    { value: '', label: t('period.any') },
    ...periods.map((period) => ({ value: period, label: t('period.days', { days: period }) })),
  ]

  return (
    <>
      <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain px-5 pt-1 pb-6 sm:px-6">
        <fieldset className="space-y-2.5">
          <legend className="pb-2.5 text-sm font-medium">{t('period.label')}</legend>
          <div className={segmentedGroup}>
            {periodOptions.map((option) => {
              const checked = (filters.period ?? '') === option.value
              return (
                <label key={option.value} className="relative">
                  <input
                    type="radio"
                    name={periodName}
                    value={option.value}
                    checked={checked}
                    onChange={() => {
                      onChange({ ...filters, period: isPeriod(option.value) ? option.value : null })
                    }}
                    className="peer absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <span
                    className={cn(
                      segmentedItem,
                      'px-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foreground',
                      checked && segmentedActive,
                    )}
                  >
                    {option.label}
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <section aria-labelledby={moodHeading} className="space-y-2.5">
          <h3 id={moodHeading} className="text-sm font-medium">
            {t('mood.label')}
          </h3>
          <MoodScale
            label={t('mood.label')}
            value={filters.mood}
            onChange={(mood) => {
              onChange({ ...filters, mood })
            }}
          />
        </section>

        <div className="space-y-1">
          <TagChecklist
            label={t('emotions.label')}
            searchLabel={t('emotions.search')}
            emptyText={t('emotions.none')}
            groups={[
              ...ownGroup(t('emotions.yours'), customEmotions, filters.emotions, isEmotionId),
              ...labels.emotionChoices(emotionFamilies),
            ]}
            selected={filters.emotions}
            canAddMore={canAddMore}
            labelOf={labels.emotion}
            onChange={(emotions) => {
              onChange({ ...filters, emotions })
            }}
          />
          <TagChecklist
            label={t('contexts.label')}
            searchLabel={t('contexts.search')}
            emptyText={t('contexts.none')}
            groups={[
              ...ownGroup(t('contexts.yours'), customContexts, filters.contexts, isContextId),
              ...labels.contextChoices(contextGroups),
            ]}
            selected={filters.contexts}
            canAddMore={canAddMore}
            labelOf={labels.context}
            onChange={(contexts) => {
              onChange({ ...filters, contexts })
            }}
          />
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px]">
            <input
              type="checkbox"
              checked={filters.withNote}
              onChange={(event) => {
                onChange({ ...filters, withNote: event.currentTarget.checked })
              }}
              className="size-[18px] cursor-pointer accent-primary"
            />
            {t('withNote')}
          </label>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-rule px-5 py-3.5 sm:px-6">
        <button
          type="button"
          disabled={active === 0}
          onClick={() => {
            onChange({ ...noFilters, q: filters.q })
          }}
          className="h-11 cursor-pointer px-1 text-[15px] underline decoration-1 underline-offset-4 disabled:cursor-default disabled:no-underline disabled:opacity-40"
        >
          {t('clear')}
        </button>
        <Button size="sm" onClick={onDone} className="h-11">
          {t('show', { count: total })}
        </Button>
      </div>
    </>
  )
}
