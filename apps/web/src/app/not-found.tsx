import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

export default function NotFound() {
  const t = useTranslations('common.notFound')

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-6">
      <h1 className="font-serif text-5xl leading-[1.04] tracking-[-0.02em]">{t('title')}</h1>
      <p className="leading-relaxed text-muted-foreground">{t('body')}</p>
      <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
        {t('back')}
      </Link>
    </main>
  )
}
