'use client'

import { useId, useState } from 'react'
import type { ChoiceGroup } from '@/features/check-in/catalog'
import { Chevron, DisclosurePanel } from '@/shared/components/disclosure'
import { SearchIcon } from '@/shared/components/icons'
import { normalizeText } from '@/shared/lib/text'

interface TagChecklistProps {
  label: string
  searchLabel: string
  emptyText: string
  groups: readonly ChoiceGroup[]
  selected: readonly string[]
  canAddMore: boolean
  labelOf: (tag: string) => string
  onChange: (tags: string[]) => void
}

function matching(groups: readonly ChoiceGroup[], term: string): ChoiceGroup[] {
  const query = normalizeText(term)
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => normalizeText(item.label).includes(query)),
    }))
    .filter((group) => group.items.length > 0)
}

export function TagChecklist({
  label,
  searchLabel,
  emptyText,
  groups,
  selected,
  canAddMore,
  labelOf,
  onChange,
}: TagChecklistProps) {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const panelId = useId()
  const shown = matching(groups, term)

  function toggle(tag: string, checked: boolean) {
    onChange(checked ? [...selected, tag] : selected.filter((item) => item !== tag))
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open)
        }}
        className="flex min-h-11 w-full cursor-pointer items-center gap-3 text-left"
      >
        <span className="shrink-0 text-sm font-medium">{label}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          {selected.map(labelOf).join(', ')}
        </span>
        <Chevron open={open} className="text-muted-foreground" />
      </button>
      <DisclosurePanel id={panelId} open={open} className="space-y-4 pt-2 pb-1">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={term}
            aria-label={searchLabel}
            placeholder={searchLabel}
            onChange={(event) => {
              setTerm(event.currentTarget.value)
            }}
            className="h-10 w-full rounded-[6px] border border-rule bg-background pr-3 pl-9 text-[15px] outline-none placeholder:text-muted-foreground focus:border-foreground [&::-webkit-search-cancel-button]:hidden"
          />
        </div>
        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : (
          shown.map((group) => (
            <fieldset key={group.id} className="space-y-1">
              <legend className="pb-1 text-xs text-muted-foreground">{group.title}</legend>
              <div className="grid grid-cols-2 gap-x-3">
                {group.items.map((item) => {
                  const checked = selected.includes(item.id)
                  return (
                    <label
                      key={item.id}
                      className="flex min-h-10 cursor-pointer items-center gap-2.5 text-[15px] has-disabled:cursor-default has-disabled:opacity-50"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!checked && !canAddMore}
                        onChange={(event) => {
                          toggle(item.id, event.currentTarget.checked)
                        }}
                        className="size-[18px] shrink-0 cursor-pointer accent-primary"
                      />
                      <span className="min-w-0 truncate">{item.label}</span>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))
        )}
      </DisclosurePanel>
    </div>
  )
}
