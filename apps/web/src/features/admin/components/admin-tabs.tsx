import Link from 'next/link'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/utils'

interface AdminTabsProps<T extends string> {
  label: string
  options: readonly T[]
  current: T
  labelOf: (option: T) => string
  hrefOf: (option: T) => ComponentProps<typeof Link>['href']
}

export function AdminTabs<T extends string>({
  label,
  options,
  current,
  labelOf,
  hrefOf,
}: AdminTabsProps<T>) {
  return (
    <nav aria-label={label}>
      <ul className="flex w-fit max-w-full overflow-x-auto rounded-[6px] border border-rule bg-background/50 p-0.5">
        {options.map((option) => {
          const active = option === current
          return (
            <li key={option}>
              <Link
                href={hrefOf(option)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block rounded-[4px] px-3 py-1.5 text-sm whitespace-nowrap transition-colors',
                  active
                    ? 'bg-surface font-medium text-foreground shadow-[0_0_0_1px_var(--rule)]'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {labelOf(option)}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
