import type { ProfessionalProfile } from '@mycogni/contracts'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { signOut } from '@/features/auth/actions'
import { Wordmark } from '@/shared/components/wordmark'
import { cn } from '@/shared/lib/utils'
import { MobileMenu } from './mobile-menu'
import { ProfessionalNavigation } from './professional-navigation'
import { ProfileMenu } from './profile-menu'
import { warnTokens } from './workspace'

interface ProfessionalShellProps {
  professional: ProfessionalProfile
  photoUrl: string | null
  children: ReactNode
}

export function ProfessionalShell({ professional, photoUrl, children }: ProfessionalShellProps) {
  const t = useTranslations('professional.shell')
  const kinds = useTranslations('common.professionalKinds')
  const verified = professional.status === 'verified'
  const profession = kinds(professional.kind)

  return (
    <div className={cn('min-h-dvh lg:grid lg:grid-cols-[232px_minmax(0,1fr)]', warnTokens)}>
      <aside className="hidden bg-surface lg:block">
        <div className="sticky top-0 flex h-dvh flex-col px-3 pt-6 pb-4">
          <div className="space-y-1 px-3">
            <Wordmark />
            <p className="text-sm text-muted-foreground">{t('area')}</p>
          </div>
          {verified && (
            <div className="mt-8">
              <ProfessionalNavigation variant="sidebar" />
            </div>
          )}
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
            photoUrl={photoUrl}
            verified={verified}
            signOut={signOut}
          />
          <Wordmark className="text-[20px]" />
          <span className="truncate pl-1 text-[13px] text-muted-foreground">{t('area')}</span>
        </div>
      </header>

      <main className="min-w-0">
        <div
          className={cn(
            'mx-auto w-full max-w-[1200px] space-y-7 px-4 pt-5 pb-12 sm:px-6 lg:space-y-9 lg:px-10 lg:pt-9 lg:pb-16',
            verified && 'max-lg:pb-28',
          )}
        >
          {children}
        </div>
      </main>

      {verified && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <ProfessionalNavigation variant="bottom" />
        </div>
      )}
    </div>
  )
}
