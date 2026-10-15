import type { ReactNode } from 'react'
import { Wordmark } from '@/shared/components/wordmark'

export default function ProfessionalJoinLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6">
      <header className="py-6">
        <Wordmark />
      </header>
      <main className="flex-1 pt-8 pb-16 sm:pt-14">
        <div className="max-w-3xl">{children}</div>
      </main>
    </div>
  )
}
