import type { ReactNode } from 'react'

export const authLink = 'font-medium text-foreground underline decoration-1 underline-offset-4'

export function AuthFootnote({ children }: { children: ReactNode }) {
  return <p className="mt-8 border-t border-rule pt-6 text-sm text-muted-foreground">{children}</p>
}
