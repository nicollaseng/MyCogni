import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { buttonVariants } from '@/shared/ui/button'

export function TodayActions() {
  const t = useTranslations('today')

  return (
    <div className="space-y-3">
      <Link href="/check-in" className={buttonVariants()}>
        {t('checkIn')}
      </Link>
      <p className="text-sm text-muted-foreground">
        {t.rich('writeMyBook', {
          link: (chunks) => (
            <Link
              href="/mybook"
              className="whitespace-nowrap text-foreground underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>
    </div>
  )
}
