import { describe, expect, it } from '@jest/globals'
import { zenArticles } from '@mycogni/domain'
import { articleImagePath, articleMetadata } from './article-metadata'

describe('articleMetadata', () => {
  it('describes the public article for search and link previews', () => {
    const metadata = articleMetadata('worry-time', 'pt-BR')
    const text = zenArticles['worry-time'].text['pt-BR']

    expect(metadata.title).toBe(text.title)
    expect(metadata.description).toBe(text.summary)
    expect(metadata.alternates?.canonical).toBe('/articles/worry-time')
    expect(metadata.robots).toEqual({ index: true, follow: true })
    expect(metadata.openGraph).toEqual(
      expect.objectContaining({
        title: text.title,
        description: text.summary,
        url: '/articles/worry-time',
        locale: 'pt_BR',
        images: [
          {
            url: '/articles/worry-time/image?lang=pt-BR',
            width: 1200,
            height: 630,
            alt: text.title,
          },
        ],
      }),
    )
    expect(metadata.twitter).toEqual(expect.objectContaining({ card: 'summary_large_image' }))
  })

  it('speaks the language of the visitor', () => {
    expect(articleMetadata('worry-time', 'en-GB').title).toBe(
      zenArticles['worry-time'].text.en.title,
    )
    expect(articleImagePath('worry-time', 'pt-PT')).toBe('/articles/worry-time/image?lang=pt-PT')
  })
})
