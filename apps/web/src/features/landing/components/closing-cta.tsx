import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/ui/button'

export function ClosingCta() {
  const t = useTranslations('landing')

  return (
    <section
      aria-labelledby="closing-title"
      className="border-t border-rule py-20 text-center sm:py-28"
    >
      <h2
        id="closing-title"
        className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] sm:text-[56px]"
      >
        {t('closing.title')}
      </h2>
      <p className="mt-4 text-lg text-muted-foreground">{t('closing.lead')}</p>
      <Link href="/sign-up" className={cn(buttonVariants({ size: 'lg' }), 'mt-9 px-9')}>
        {t('cta.start')}
      </Link>
    </section>
  )
}
