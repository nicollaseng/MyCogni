import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'

export type BookView = 'pages' | 'photos'

const views = [
  { key: 'pages', href: '/mybook' },
  { key: 'photos', href: '/mybook/photos' },
] as const

export function BookViews({ current }: { current: BookView }) {
  const t = useTranslations('mybook.photoGrid.views')
  return (
    <nav aria-label={t('label')} className="inline-flex rounded-[8px] bg-surface p-0.5">
      {views.map((view) => (
        <Link
          key={view.key}
          href={view.href}
          aria-current={current === view.key ? 'page' : undefined}
          className={cn(
            'inline-flex h-9 items-center rounded-[6px] px-4 text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground motion-reduce:transition-none',
            current === view.key &&
              'bg-background font-medium text-foreground shadow-[0_0_0_1px_var(--rule)]',
          )}
        >
          {t(view.key)}
        </Link>
      ))}
    </nav>
  )
}
