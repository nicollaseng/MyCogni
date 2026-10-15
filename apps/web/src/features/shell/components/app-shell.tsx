import { useTranslations } from 'next-intl'
import { Suspense, type ReactNode } from 'react'
import { BellLink } from '@/features/care/components/bell-link'
import { NotificationBell } from '@/features/care/components/notification-bell'
import { HelpDisclosure } from '@/shared/components/help-disclosure'
import { Wordmark } from '@/shared/components/wordmark'
import { CurrentNavigation } from './current-navigation'

export function AppShell({ children }: { children: ReactNode }) {
  const navigationLabel = useTranslations('common.navigation')('label')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-6 px-6 py-5">
          <Wordmark />
          <div className="flex items-center gap-6">
            <nav aria-label={navigationLabel} className="hidden sm:block">
              <CurrentNavigation variant="top" />
            </nav>
            <Suspense fallback={<BellLink unread={0} />}>
              <NotificationBell />
            </Suspense>
          </div>
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
        className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-background pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <CurrentNavigation variant="bar" />
      </nav>
    </div>
  )
}
