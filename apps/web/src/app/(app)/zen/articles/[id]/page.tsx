import { articleNarration, contentLanguageOf, isArticleId, zenArticles } from '@mycogni/domain'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { fetchNarrationManifest, narrationSources } from '@/features/audio/narration'
import { ArticleView } from '@/features/zen/components/article-view'
import { ZenTopBar } from '@/features/zen/components/zen-top-bar'
import { ReadingTracker } from '@/features/zen/practice/reading-tracker'
import { articlePath } from '@/features/zen/share'
import { requireOnboardedProfile } from '@/shared/lib/auth/session'
import { guarded } from '@/shared/lib/settled'
import { siteUrlOf } from '@/shared/lib/site-url'

export async function generateMetadata({
  params,
}: PageProps<'/zen/articles/[id]'>): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  return isArticleId(id)
    ? {
        title: zenArticles[id].text[contentLanguageOf(locale)].title,
        alternates: { canonical: articlePath(id) },
      }
    : {}
}

export default async function ZenArticlePage({ params }: PageProps<'/zen/articles/[id]'>) {
  const [[{ id }], [locale, manifest]] = await guarded(
    Promise.all([params, requireOnboardedProfile()]),
    Promise.all([getLocale(), fetchNarrationManifest()]),
  )
  if (!isArticleId(id)) {
    notFound()
  }
  const language = contentLanguageOf(locale)

  return (
    <>
      <ZenTopBar />
      <ArticleView
        id={id}
        narration={narrationSources(
          manifest,
          language,
          articleNarration(zenArticles[id].text[language]),
        )}
        shareUrl={siteUrlOf(articlePath(id)).toString()}
        ending={<ReadingTracker article={id} />}
      />
    </>
  )
}
