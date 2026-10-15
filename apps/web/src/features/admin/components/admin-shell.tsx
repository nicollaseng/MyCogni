import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Wordmark } from '@/shared/components/wordmark'
import { AdminNavigation } from './admin-navigation'

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations('admin.shell')

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6 lg:px-10">
          <Wordmark className="text-[20px]" />
          <span className="hidden text-[13px] text-muted-foreground sm:inline">{t('team')}</span>
          <AdminNavigation />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-7 px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-9">
        {children}
      </main>
    </div>
  )
}
