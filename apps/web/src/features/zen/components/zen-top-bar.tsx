import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { HelpNow } from './help-now'

export function ZenTopBar({ professionals }: { professionals: readonly string[] }) {
  const t = useTranslations('zen')

  return (
    <div className="-mt-4 flex items-center justify-between gap-4 sm:-mt-6">
      <Link
        href="/zen"
        className="inline-flex h-10 items-center text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t('back')}
      </Link>
      <HelpNow professionals={professionals} />
    </div>
  )
}
