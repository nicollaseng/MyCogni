import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

export function StepActions({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'mt-auto flex shrink-0 flex-col pt-5 pb-[calc(1.375rem+env(safe-area-inset-bottom))]',
        className,
      )}
    >
      {children}
    </div>
  )
}
