import { contentLanguageOf, zenArticles, type ArticleId, type Locale } from '@mycogni/domain'
import type { Metadata } from 'next'
import { articlePath } from './share'

export const articleImageSize = { width: 1200, height: 630 } as const

export function articleImagePath(id: ArticleId, locale: Locale): string {
  return `${articlePath(id)}/image?lang=${locale}`
}

export function articleMetadata(id: ArticleId, locale: Locale): Metadata {
  const text = zenArticles[id].text[contentLanguageOf(locale)]
  const image = { url: articleImagePath(id, locale), ...articleImageSize, alt: text.title }
  return {
    title: text.title,
    description: text.summary,
    alternates: { canonical: articlePath(id) },
    robots: { index: true, follow: true },
    openGraph: {
      type: 'article',
      siteName: 'MyCogniAI',
      locale: locale.replace('-', '_'),
      url: articlePath(id),
      title: text.title,
      description: text.summary,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: text.title,
      description: text.summary,
      images: [image],
    },
  }
}
