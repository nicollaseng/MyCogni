import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

const breathing = 'motion-safe:animate-breathe'

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('block rounded-sm bg-foreground/[0.07]', breathing, className)}
    />
  )
}

export function SkeletonPanel({
  className,
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  return (
    <span
      aria-hidden
      className={cn('block rounded-lg bg-surface', children === undefined && breathing, className)}
    >
      {children}
    </span>
  )
}

export function LoadingState({ children, className }: { children: ReactNode; className?: string }) {
  const t = useTranslations('common')
  return (
    <div aria-busy="true" className={className}>
      <p role="status" className="sr-only">
        {t('loading')}
      </p>
      {children}
    </div>
  )
}

export function SectionSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-36" />
      {children}
    </div>
  )
}

export function LinesSkeleton({
  widths,
  className,
}: {
  widths: readonly string[]
  className?: string
}) {
  return (
    <span aria-hidden className={cn('block space-y-2.5', className)}>
      {widths.map((width, index) => (
        <Skeleton key={index} className={cn('h-4', width)} />
      ))}
    </span>
  )
}

export function RowsSkeleton({ rows, className }: { rows: number; className?: string }) {
  return (
    <span aria-hidden className={cn('block space-y-6', className)}>
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className="block space-y-2">
          <Skeleton className={cn('h-4', index % 2 === 0 ? 'w-2/5' : 'w-1/3')} />
          <Skeleton className="h-3.5 w-1/2" />
        </span>
      ))}
    </span>
  )
}
