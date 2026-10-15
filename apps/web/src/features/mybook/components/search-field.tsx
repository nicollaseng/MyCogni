'use client'

import { useEffect, useRef, useState } from 'react'
import { Icon } from './icon'

interface SearchFieldProps {
  label: string
  placeholder: string
  initial: string
  onSearch: (query: string) => void
  delay?: number
  className?: string
}

export function SearchField({
  label,
  placeholder,
  initial,
  onSearch,
  delay = 300,
  className,
}: SearchFieldProps) {
  const [value, setValue] = useState(initial)
  const latestSearch = useRef(onSearch)
  const searched = useRef(initial.trim())

  useEffect(() => {
    latestSearch.current = onSearch
  }, [onSearch])

  useEffect(() => {
    const query = value.trim()
    if (query === searched.current) {
      return
    }
    const timer = setTimeout(() => {
      if (query !== searched.current) {
        searched.current = query
        latestSearch.current(query)
      }
    }, delay)
    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return (
    <form
      role="search"
      className={className}
      onSubmit={(event) => {
        event.preventDefault()
        searched.current = value.trim()
        latestSearch.current(searched.current)
      }}
    >
      <label className="relative block">
        <span className="sr-only">{label}</span>
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          value={value}
          placeholder={placeholder}
          enterKeyHint="search"
          autoComplete="off"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          className="h-12 w-full rounded-[6px] border border-rule bg-white/60 pr-4 pl-10 text-base transition-colors outline-none placeholder:text-muted-foreground focus:border-foreground dark:bg-white/5"
        />
      </label>
    </form>
  )
}
