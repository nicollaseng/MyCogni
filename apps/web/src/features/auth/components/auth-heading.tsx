import type { ReactNode } from 'react'

export function AuthHeading({ title, children }: { title: string; children: ReactNode }) {
  return (
    <header className="mb-8 space-y-3">
      <h1 className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em]">{title}</h1>
      <p className="leading-relaxed text-muted-foreground">{children}</p>
    </header>
  )
}
