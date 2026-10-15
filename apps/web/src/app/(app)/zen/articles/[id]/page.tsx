import { articleNarration, contentLanguageOf, isArticleId, zenArticles } from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { fetchNarrationManifest, narrationSources } from '@/features/audio/narration'
import { ArticleView } from '@/features/zen/components/article-view'
import { ZenTopBar } from '@/features/zen/components/zen-top-bar'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'

export async function generateMetadata({
  params,
}: PageProps<'/zen/articles/[id]'>): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  return isArticleId(id) ? { title: zenArticles[id].text[contentLanguageOf(locale)].title } : {}
}

export default async function ZenArticlePage({ params }: PageProps<'/zen/articles/[id]'>) {
  await requireOnboardedProfile()
  const { id } = await params
  if (!isArticleId(id)) {
    notFound()
  }
  const [locale, careLinks, manifest] = await Promise.all([
    getLocale(),
    fetchCareLinks(),
    fetchNarrationManifest(),
  ])
  const language = contentLanguageOf(locale)

  return (
    <>
      <ZenTopBar professionals={careLinks.map((link) => link.professional.name)} />
      <ArticleView
        id={id}
        narration={narrationSources(
          manifest,
          language,
          articleNarration(zenArticles[id].text[language]),
        )}
      />
    </>
  )
}
