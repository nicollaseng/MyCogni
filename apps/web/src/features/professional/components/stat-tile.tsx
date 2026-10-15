import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface StatProps {
  label: string
  value: ReactNode
  caption?: ReactNode
  tone?: 'default' | 'warn'
}

export function Stat({ label, value, caption, tone = 'default' }: StatProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 border-rule py-1 pl-4 max-lg:even:border-l lg:border-l lg:first:border-l-0 lg:first:pl-0 max-lg:odd:pl-0">
      <dt className="flex items-center gap-1.5 text-[13px] leading-snug text-muted-foreground">
        {tone === 'warn' && (
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-(--warn)" />
        )}
        {label}
      </dt>
      <dd className="contents">
        <span
          className={cn(
            'text-[24px] leading-none font-semibold tracking-[-0.02em] sm:text-[28px]',
            tone === 'warn' && 'text-(--warn)',
          )}
        >
          {value}
        </span>
        {caption !== undefined && (
          <span className="text-[12.5px] leading-snug text-muted-foreground sm:text-[13px]">
            {caption}
          </span>
        )}
      </dd>
    </div>
  )
}

export function StatStrip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <dl aria-label={label} className="grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-4 lg:gap-x-6">
      {children}
    </dl>
  )
}
