import type { ReactNode } from 'react'

export function StepHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mt-8 space-y-3">
      <h1 className="font-serif text-[34px] leading-[1.06] tracking-[-0.02em] text-balance">
        {title}
      </h1>
      {children !== undefined && (
        <p className="text-[15px] leading-relaxed text-pretty text-muted-foreground">{children}</p>
      )}
    </div>
  )
}
