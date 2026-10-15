import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { signOut } from '@/features/auth/actions'
import { FreshOnReturn } from '@/features/shell/components/fresh-on-return'
import { Wordmark } from '@/shared/components/wordmark'
import { cn } from '@/shared/lib/utils'
import { ProfileMenu } from './profile-menu'

interface OnboardingShellProps {
  name: string
  profession: string
  photoUrl: string | null
  className?: string
  children: ReactNode
}

const column = 'mx-auto w-full max-w-[1080px] px-4 sm:px-6 lg:px-10'

export function OnboardingShell({
  name,
  profession,
  photoUrl,
  className,
  children,
}: OnboardingShellProps) {
  const t = useTranslations('professional.shell')
  return (
    <div className={cn('min-h-dvh', className)}>
      <FreshOnReturn />
      <header className="border-b border-rule">
        <div className={cn(column, 'flex h-16 items-center justify-between gap-4')}>
          <div className="flex min-w-0 items-baseline gap-3">
            <Wordmark href="/pro" className="text-[20px] sm:text-[22px]" />
            <span className="truncate text-[13px] text-muted-foreground sm:text-sm">
              {t('area')}
            </span>
          </div>
          <ProfileMenu
            name={name}
            profession={profession}
            photoUrl={photoUrl}
            signOut={signOut}
            placement="header"
          />
        </div>
      </header>
      <main
        data-shell="onboarding"
        className={cn(
          column,
          'group/shell space-y-7 pt-8 pb-16 sm:pt-10 lg:space-y-9 lg:pt-14 lg:pb-24',
        )}
      >
        {children}
      </main>
    </div>
  )
}
