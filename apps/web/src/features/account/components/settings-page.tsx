import Link from 'next/link'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'

interface SettingsPageProps {
  title: string
  ownTitles?: 'shown' | 'hidden'
  children: ReactNode
}

const ownTitleHidden = '[&>div>section>h2]:sr-only [&>section>h2]:sr-only'

export function SettingsPage({ title, ownTitles = 'shown', children }: SettingsPageProps) {
  const t = useTranslations('account.nav')

  return (
    <div className="space-y-8">
      <Link
        href="/me"
        className="-ml-1 inline-flex h-10 items-center gap-1 pr-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
      >
        <span aria-hidden>←</span>
        {t('back')}
      </Link>
      <h1 className="font-serif text-[32px] leading-[1.08] tracking-[-0.02em]">{title}</h1>
      <div className={cn('space-y-10', ownTitles === 'hidden' && ownTitleHidden)}>{children}</div>
    </div>
  )
}
