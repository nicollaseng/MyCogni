import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface SectionProps {
  title: string
  children: ReactNode
  className?: string
}

export function Section({ title, children, className }: SectionProps) {
  return (
    <section aria-label={title} className={cn('space-y-3', className)}>
      <h2 className="px-1 text-sm text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-[22px] bg-surface px-5 py-2', className)}>{children}</div>
}
