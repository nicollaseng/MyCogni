import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Wordmark } from '@/shared/components/wordmark'
import { ProfessionalNavigation } from './professional-navigation'

interface ProfessionalShellProps {
  verified: boolean
  children: ReactNode
}

export function ProfessionalShell({ verified, children }: ProfessionalShellProps) {
  const t = useTranslations('professional.shell')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-10 gap-y-4 px-6 py-5">
          <div className="flex items-baseline gap-3">
            <Wordmark />
            <span className="text-sm text-muted-foreground">{t('area')}</span>
          </div>
          {verified && (
            <div className="order-last w-full sm:order-none sm:w-auto">
              <ProfessionalNavigation />
            </div>
          )}
          <Link
            href="/today"
            className="ml-auto text-sm text-muted-foreground underline decoration-1 underline-offset-4 transition-colors hover:text-foreground"
          >
            {t('diary')}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-6 pt-10 pb-16 sm:pt-14">
        {children}
      </main>
    </div>
  )
}
