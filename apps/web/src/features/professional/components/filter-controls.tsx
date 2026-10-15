'use client'

import { useId } from 'react'
import { cn } from '@/shared/lib/utils'
import { SearchIcon } from './icons'

interface SearchFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function SearchField({ label, placeholder, value, onChange }: SearchFieldProps) {
  return (
    <label className="relative block w-full sm:w-72">
      <span className="sr-only">{label}</span>
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(event) => {
          onChange(event.currentTarget.value)
        }}
        className="h-9 w-full rounded-[6px] border border-rule bg-background/70 pr-3 pl-9 text-[15px] transition-colors outline-none placeholder:text-muted-foreground focus:border-foreground/60 focus:bg-background dark:bg-white/5"
      />
    </label>
  )
}

interface OptionsProps<T extends string> {
  label: string
  options: readonly T[]
  value: T
  labelOf: (option: T) => string
  onChange: (option: T) => void
}

interface FilterControlProps<T extends string> extends OptionsProps<T> {
  counts: Readonly<Record<T, number>>
}

const segmentBox = 'flex w-fit rounded-[6px] border border-rule bg-background/50 p-0.5'

function segmentStyle(checked: boolean): string {
  return cn(
    'inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-sm whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-foreground',
    checked
      ? 'bg-surface font-medium text-foreground shadow-[0_0_0_1px_var(--rule)]'
      : 'text-muted-foreground hover:text-foreground',
  )
}

export function FilterControl<T extends string>({
  label,
  options,
  value,
  counts,
  labelOf,
  onChange,
}: FilterControlProps<T>) {
  const name = useId()
  return (
    <>
      <fieldset className="hidden md:block">
        <legend className="sr-only">{label}</legend>
        <div className={segmentBox}>
          {options.map((option) => (
            <label key={option} className={segmentStyle(option === value)}>
              <input
                type="radio"
                name={name}
                value={option}
                checked={option === value}
                onChange={() => {
                  onChange(option)
                }}
                className="sr-only"
              />
              {labelOf(option)}
              <span className="text-[13px] text-muted-foreground tabular-nums">
                {counts[option]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex w-full items-center gap-2 text-sm text-muted-foreground md:hidden">
        <span className="shrink-0">{label}</span>
        <select
          value={value}
          onChange={(event) => {
            const chosen = options.find((option) => option === event.currentTarget.value)
            if (chosen !== undefined) {
              onChange(chosen)
            }
          }}
          className="h-9 min-w-0 flex-1 rounded-[6px] border border-rule bg-background/70 px-2.5 text-[15px] text-foreground dark:bg-white/5"
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {`${labelOf(option)} (${String(counts[option])})`}
            </option>
          ))}
        </select>
      </label>
    </>
  )
}

export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  labelOf,
  onChange,
}: OptionsProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className="sr-only">{label}</legend>
      <div className={segmentBox}>
        {options.map((option) => (
          <label key={option} className={segmentStyle(option === value)}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={option === value}
              onChange={() => {
                onChange(option)
              }}
              className="sr-only"
            />
            {labelOf(option)}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
