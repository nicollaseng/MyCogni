import type { ArticleId, Locale } from '@mycogni/domain'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SiteFooter } from '@/features/landing/components/site-footer'
import { SiteHeader } from '@/features/landing/components/site-header'
import { buttonVariants } from '@/shared/ui/button'
import { ArticleView } from './article-view'

interface PublicArticleProps {
  id: ArticleId
  shareUrl: string
  chooseLocale: (locale: Locale) => Promise<void>
}

export function PublicArticle({ id, shareUrl, chooseLocale }: PublicArticleProps) {
  const t = useTranslations('zen.public')

  return (
    <div className="mx-auto w-full max-w-6xl px-6 sm:px-10">
      <SiteHeader chooseLocale={chooseLocale} />
      <main className="max-w-3xl pt-10 pb-20 sm:pt-16 sm:pb-28">
        <ArticleView id={id} shareUrl={shareUrl} showTracks={false} />
        <Link href="/" className={buttonVariants({ variant: 'outline', className: 'mt-12' })}>
          {t('cta')}
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
