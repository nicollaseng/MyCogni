'use client'

import { useId, useState } from 'react'
import { cn } from '@/shared/lib/utils'
import type { ChoiceGroup } from '../catalog'

interface ChoicePickerProps {
  tabs: readonly ChoiceGroup[]
  selected: readonly string[]
  onToggle: (item: string) => void
  searchLabel: string
}

const visibleResults = 9

const chipStyles =
  'h-[38px] rounded-full border px-[15px] text-[15px] transition-[background-color,color,border-color,transform] duration-150 active:scale-[0.97] motion-reduce:transition-none'

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

export function ChoicePicker({ tabs, selected, onToggle, searchLabel }: ChoicePickerProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [query, setQuery] = useState('')
  const panelId = useId()

  const catalog = [...new Set(tabs.flatMap((tab) => tab.items))]
  const searchTerm = normalize(query)
  const searching = searchTerm !== ''
  const custom = selected.filter((item) => !catalog.includes(item))
  const exactMatch = catalog.find((item) => normalize(item) === searchTerm)
  const visible = searching
    ? catalog.filter((item) => normalize(item).includes(searchTerm)).slice(0, visibleResults)
    : [...(tabs[activeIndex]?.items ?? []), ...(activeIndex === 0 ? custom : [])]
  const newItem = query.trim().toLowerCase()
  const canCreate = searching && exactMatch === undefined && !selected.includes(newItem)

  function add() {
    const item = exactMatch ?? newItem
    if (item !== '' && !selected.includes(item)) {
      onToggle(item)
    }
    setQuery('')
  }

  return (
    <div className="flex flex-col">
      <div
        role="tablist"
        className="mt-5 flex gap-5 overflow-x-auto border-b border-rule [scrollbar-width:none] [mask-image:linear-gradient(to_right,#000_85%,transparent)]"
      >
        {tabs.map((tab, index) => {
          const active = !searching && index === activeIndex
          const hasPicked = tab.items.some((item) => selected.includes(item))
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={panelId}
              onClick={() => {
                setActiveIndex(index)
                setQuery('')
              }}
              className={cn(
                '-mb-px h-10 shrink-0 border-b-2 text-[15px] transition-colors',
                active
                  ? 'border-foreground font-medium text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.title}
              {hasPicked && (
                <span
                  aria-hidden
                  className="ml-1.5 inline-block size-[5px] rounded-full bg-foreground align-[2px]"
                />
              )}
            </button>
          )
        })}
      </div>

      <div
        id={panelId}
        role="tabpanel"
        className="mt-4 flex min-h-[140px] flex-wrap content-start gap-2"
      >
        {visible.map((item) => {
          const pressed = selected.includes(item)
          return (
            <button
              key={item}
              type="button"
              aria-pressed={pressed}
              onClick={() => {
                onToggle(item)
              }}
              className={cn(
                chipStyles,
                pressed
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-rule bg-white/55 hover:border-foreground/30 dark:bg-white/5',
              )}
            >
              {item}
            </button>
          )
        })}
        {canCreate && (
          <button
            type="button"
            aria-label={`Adicionar ${newItem}`}
            onClick={add}
            className={cn(chipStyles, 'border-dashed border-foreground/40')}
          >
            + {newItem}
          </button>
        )}
      </div>

      <label className="mt-3 flex h-11 items-center border-b border-rule focus-within:border-foreground">
        <input
          type="search"
          value={query}
          placeholder={searchLabel}
          aria-label={searchLabel}
          onChange={(event) => {
            setQuery(event.currentTarget.value)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add()
            }
          }}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>

      <p aria-live="polite" className="mt-3 min-h-[21px] text-sm text-muted-foreground">
        {selected.length > 0 && (
          <>
            Escolhidas: <span className="font-medium text-foreground">{selected.join(', ')}</span>
          </>
        )}
      </p>
    </div>
  )
}
