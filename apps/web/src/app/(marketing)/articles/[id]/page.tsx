import { isArticleId, isLocale } from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { chooseLocale } from '@/features/locale/actions'
import { articleMetadata } from '@/features/zen/article-metadata'
import { PublicArticle } from '@/features/zen/components/public-article'
import { articlePath } from '@/features/zen/share'
import { currentAccountType } from '@/shared/lib/auth/account-type'
import { currentUser } from '@/shared/lib/auth/session'
import { siteUrlOf } from '@/shared/lib/site-url'

export async function generateMetadata({ params }: PageProps<'/articles/[id]'>): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  return isArticleId(id) && isLocale(locale) ? articleMetadata(id, locale) : {}
}

export default async function PublicArticlePage({ params }: PageProps<'/articles/[id]'>) {
  const [{ id }, user] = await Promise.all([params, currentUser()])
  if (!isArticleId(id)) {
    notFound()
  }
  if (user !== null && (await currentAccountType()) === 'patient') {
    redirect(`/zen/articles/${id}`)
  }

  return (
    <PublicArticle
      id={id}
      shareUrl={siteUrlOf(articlePath(id)).toString()}
      chooseLocale={chooseLocale}
    />
  )
}
