import { useTranslations } from 'next-intl'
import { Suspense, type ReactNode } from 'react'
import { AmbientControl } from '@/features/audio/components/ambient-control'
import { assistantActions } from '@/features/assistant/bound-actions'
import { AssistantLauncher } from '@/features/assistant/components/assistant-launcher'
import { signOut } from '@/features/auth/actions'
import { BellLink } from '@/features/care/components/bell-link'
import { NotificationBell } from '@/features/care/components/notification-bell'
import { HelpDisclosure } from '@/shared/components/help-disclosure'
import { Wordmark } from '@/shared/components/wordmark'
import { AccountMenu } from './account-menu'
import { CurrentNavigation } from './current-navigation'
import { FooterHelp } from './footer-help'
import { FreshOnReturn } from './fresh-on-return'

interface AppShellProps {
  name: string | null
  email: string | null
  photoUrl: string | null
  timeZone: string
  children: ReactNode
}

export function AppShell({ name, email, photoUrl, timeZone, children }: AppShellProps) {
  const navigationLabel = useTranslations('common.navigation')('label')

  return (
    <div className="flex min-h-dvh flex-col">
      <FreshOnReturn />
      <header className="border-b border-rule">
        <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-6 px-6 py-5">
          <Wordmark />
          <div className="flex items-center gap-6">
            <nav aria-label={navigationLabel} className="hidden sm:block">
              <CurrentNavigation variant="top" />
            </nav>
            <div className="flex items-center gap-2">
              <AmbientControl />
              <Suspense fallback={<BellLink unread={0} />}>
                <NotificationBell timeZone={timeZone} />
              </Suspense>
              <AccountMenu name={name} email={email} photoUrl={photoUrl} signOut={signOut} />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-10 px-6 pt-10 pb-12 sm:pt-14">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-3xl px-6 pb-28 sm:pb-12">
        <Suspense fallback={<HelpDisclosure />}>
          <FooterHelp />
        </Suspense>
      </footer>

      <AssistantLauncher actions={assistantActions} timeZone={timeZone} />

      <nav
        aria-label={navigationLabel}
        className="fixed inset-x-0 bottom-0 z-10 border-t border-rule bg-background pb-[env(safe-area-inset-bottom)] sm:hidden"
      >
        <CurrentNavigation variant="bar" />
      </nav>
    </div>
  )
}
