import type { ReactNode } from 'react'
import { HelpDisclosure } from '@/shared/components/help-disclosure'
import { Wordmark } from '@/shared/components/wordmark'
import { CurrentNavigation } from './current-navigation'

const navigationLabel = 'Navegação principal'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
          <Wordmark />
          <nav aria-label={navigationLabel} className="hidden sm:block">
            <CurrentNavigation variant="top" />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-6 pt-10 pb-12 sm:pt-14">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-28 sm:pb-12">
        <HelpDisclosure />
      </footer>

      <nav
        aria-label={navigationLabel}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <CurrentNavigation variant="bar" />
      </nav>
    </div>
  )
}
