import { useId, type ReactNode } from 'react'
import { buttonVariants } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

export const warnTokens =
  '[--warn:#8a5716] [--warn-soft:color-mix(in_oklab,#c08a3e_15%,transparent)] dark:[--warn:#e2b46b] dark:[--warn-soft:color-mix(in_oklab,#e2b46b_13%,transparent)]'

export const compactButton = cn(buttonVariants({ size: 'sm' }), 'h-9 gap-1.5 px-3.5 text-sm')

export const quietButton = cn(
  buttonVariants({ variant: 'outline', size: 'sm' }),
  'h-9 gap-1.5 px-3.5 text-sm hover:bg-surface',
)

interface WorkspaceHeaderProps {
  title: string
  kicker?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

export function WorkspaceHeader({
  title,
  kicker,
  description,
  actions,
  children,
}: WorkspaceHeaderProps) {
  return (
    <header className="min-w-0 space-y-1.5">
      {kicker !== undefined && <div className="text-sm text-muted-foreground">{kicker}</div>}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <h1 className="min-w-0 font-serif text-[28px] leading-[1.1] tracking-[-0.015em] sm:text-[34px]">
          {title}
        </h1>
        {actions !== undefined && <div className="flex flex-wrap gap-2 sm:pt-1">{actions}</div>}
      </div>
      {description !== undefined && (
        <div className="max-w-[44rem] text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </div>
      )}
      {children}
    </header>
  )
}

interface WorkspaceSectionProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

export function WorkspaceSection({
  title,
  description,
  action,
  className,
  children,
}: WorkspaceSectionProps) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} className={cn('min-w-0 space-y-3', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0 space-y-0.5">
          <h2 id={titleId} className="font-serif text-[21px] leading-tight tracking-[-0.01em]">
            {title}
          </h2>
          {description !== undefined && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded-[8px] bg-surface', className)}>{children}</div>
}

export function Quiet({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[8px] bg-surface px-4 py-5 text-[15px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  )
}

interface EmptyStateProps {
  title?: string
  children: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-2.5 rounded-[8px] bg-surface px-5 py-6">
      {title !== undefined && (
        <h2 className="font-serif text-[22px] leading-tight tracking-[-0.01em]">{title}</h2>
      )}
      <p className="max-w-[40rem] text-[15px] leading-relaxed text-muted-foreground">{children}</p>
      {action !== undefined && <div className="pt-1.5">{action}</div>}
    </div>
  )
}
