import { isArticleId } from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ArticleView } from '@/features/zen/components/article-view'
import { articles } from '@/features/zen/content/articles'
import { contentLanguageOf } from '@/features/zen/content/language'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata({
  params,
}: PageProps<'/zen/articles/[id]'>): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  return isArticleId(id) ? { title: articles[id].text[contentLanguageOf(locale)].title } : {}
}

export default async function ZenArticlePage({ params }: PageProps<'/zen/articles/[id]'>) {
  await requireOnboardedProfile()
  const { id } = await params
  if (!isArticleId(id)) {
    notFound()
  }
  return <ArticleView id={id} />
}
