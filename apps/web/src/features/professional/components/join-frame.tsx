import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Wordmark } from '@/shared/components/wordmark'

interface JoinFrameProps {
  signOut?: () => Promise<void>
  children: ReactNode
}

export function JoinFrame({ signOut, children }: JoinFrameProps) {
  const t = useTranslations('professional.shell')

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6">
      <header className="flex items-center justify-between gap-4 py-6">
        <Wordmark />
        {signOut !== undefined && (
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
            >
              {t('signOut')}
            </button>
          </form>
        )}
      </header>
      <main className="flex-1 pt-8 pb-16 sm:pt-14">{children}</main>
    </div>
  )
}
