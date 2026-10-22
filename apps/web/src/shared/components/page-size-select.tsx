'use client'

import type { PageSize } from '@mycogni/domain'
import type { Route } from 'next'
import { useRouter } from 'next/navigation'
import { useId, useOptimistic, useTransition } from 'react'

export interface SizeOption<Href extends string> {
  size: PageSize
  href: Route<Href>
}

interface PageSizeSelectProps<Href extends string> {
  label: string
  size: PageSize
  options: readonly SizeOption<Href>[]
}

export function PageSizeSelect<Href extends string>({
  label,
  size,
  options,
}: PageSizeSelectProps<Href>) {
  const router = useRouter()
  const id = useId()
  const [, startTransition] = useTransition()
  const [shown, show] = useOptimistic(size)

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="sr-only text-sm whitespace-nowrap text-muted-foreground sm:not-sr-only"
      >
        {label}
      </label>
      <select
        id={id}
        value={shown}
        onChange={(event) => {
          const chosen = options.find((option) => String(option.size) === event.currentTarget.value)
          if (chosen !== undefined) {
            startTransition(() => {
              show(chosen.size)
              router.push(chosen.href)
            })
          }
        }}
        className="h-9 cursor-pointer rounded-[6px] border border-rule bg-transparent pr-1 pl-2.5 text-sm text-foreground tabular-nums"
      >
        {options.map((option) => (
          <option key={option.size} value={option.size}>
            {option.size}
          </option>
        ))}
      </select>
    </div>
  )
}
