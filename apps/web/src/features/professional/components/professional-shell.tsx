import type { AlertCount, ProfessionalProfile } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { signOut } from '@/features/auth/actions'
import { FreshOnReturn } from '@/features/shell/components/fresh-on-return'
import { Wordmark } from '@/shared/components/wordmark'
import { cn } from '@/shared/lib/utils'
import { MobileMenu } from './mobile-menu'
import { OnboardingShell } from './onboarding-shell'
import { ProfessionalNavigation } from './professional-navigation'
import { ProfileMenu } from './profile-menu'
import { warnTokens } from './workspace'

interface ProfessionalShellProps {
  professional: ProfessionalProfile
  photoUrl: string | null
  alerts: AlertCount | null
  children: ReactNode
}

export function ProfessionalShell({
  professional,
  photoUrl,
  alerts,
  children,
}: ProfessionalShellProps) {
  const t = useTranslations('professional.shell')
  const kinds = useTranslations('common.professionalKinds')
  const profession = kinds(professional.kind)

  if (professional.status !== 'verified') {
    return (
      <OnboardingShell
        name={professional.fullName}
        profession={profession}
        photoUrl={photoUrl}
        className={warnTokens}
      >
        {children}
      </OnboardingShell>
    )
  }

  return (
    <div className={cn('min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]', warnTokens)}>
      <FreshOnReturn />
      <aside className="hidden bg-surface lg:block">
        <div className="sticky top-0 flex h-dvh flex-col px-3 pt-6 pb-4">
          <div className="space-y-1 px-3">
            <Wordmark />
            <p className="text-sm text-muted-foreground">{t('area')}</p>
          </div>
          <div className="mt-8">
            <ProfessionalNavigation variant="sidebar" alerts={alerts} />
          </div>
          <div className="mt-auto">
            <ProfileMenu
              name={professional.fullName}
              profession={profession}
              photoUrl={photoUrl}
              signOut={signOut}
            />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-20 border-b border-rule bg-background/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center gap-2 px-4">
          <MobileMenu
            name={professional.fullName}
            profession={profession}
            alerts={alerts}
            signOut={signOut}
          />
          <Wordmark className="text-[20px]" />
          <span className="truncate pl-1 text-[13px] text-muted-foreground">{t('area')}</span>
        </div>
      </header>

      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1200px] space-y-7 px-4 pt-5 pb-12 max-lg:pb-28 sm:px-6 lg:space-y-9 lg:px-10 lg:pt-9 lg:pb-16">
          {children}
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ProfessionalNavigation variant="bottom" alerts={alerts} />
      </div>
    </div>
  )
}
