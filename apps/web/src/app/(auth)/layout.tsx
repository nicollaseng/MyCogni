import type { ReactNode } from 'react'
import { HelpDisclosure } from '@/shared/components/help-disclosure'
import { Wordmark } from '@/shared/components/wordmark'

export default function AuthLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 sm:px-10">
      <header className="py-6">
        <Wordmark />
      </header>
      <main className="flex flex-1 justify-center py-8 sm:items-center sm:py-12">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
      <footer className="py-6">
        <HelpDisclosure />
      </footer>
    </div>
  )
}
