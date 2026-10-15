import type { ReactNode } from 'react'

interface PageTitleProps {
  title: string
  kicker?: ReactNode
  description?: ReactNode
  titleId?: string
  action?: ReactNode
}

export function PageTitle({ title, kicker, description, titleId, action }: PageTitleProps) {
  return (
    <header className="space-y-3">
      {kicker !== undefined && <p className="text-sm text-muted-foreground">{kicker}</p>}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h1
          id={titleId}
          className="font-serif text-[40px] leading-[1.04] tracking-[-0.02em] sm:text-5xl"
        >
          {title}
        </h1>
        {action !== undefined && <div className="ml-auto shrink-0 pb-1">{action}</div>}
      </div>
      {description !== undefined && (
        <p className="max-w-[36rem] leading-relaxed text-muted-foreground">{description}</p>
      )}
    </header>
  )
}
