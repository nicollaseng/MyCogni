import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export const table = {
  base: 'w-full border-separate border-spacing-0 text-sm md:text-[15px]',
  head: 'sticky top-0 z-10 bg-surface px-3 py-2.5 text-left text-[13px] font-normal whitespace-nowrap text-muted-foreground shadow-[inset_0_-1px_0_var(--rule)]',
  headFirst: 'left-0 z-20 pl-4',
  row: 'group',
  cell: 'bg-surface px-3 py-3 align-top transition-colors group-hover:bg-sage',
  first: 'sticky left-0 z-[1] pl-4 max-md:shadow-[inset_-1px_0_0_var(--rule)]',
  numeric: 'text-right tabular-nums',
}

interface TableScrollProps {
  label: string
  className?: string
  children: ReactNode
}

export function TableScroll({ label, className, children }: TableScrollProps) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        'relative max-h-[min(72dvh,660px)] overflow-auto overscroll-contain rounded-[8px] bg-surface outline-offset-2 [scrollbar-width:thin]',
        className,
      )}
    >
      {children}
    </div>
  )
}
