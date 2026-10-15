import { describe, expect, it } from '@jest/globals'
import {
  draftOf,
  imagePathsOf,
  imageSizeOf,
  isBlankDraft,
  journalDocumentOf,
  plainTextOf,
  withImageSources,
  withoutImageSources,
} from './document'
import { sampleDocument } from './test-data'

describe('imagePathsOf', () => {
  it('lists every photo of the page once, in reading order', () => {
    expect(imagePathsOf(sampleDocument)).toEqual(['user/entry/one.png', 'user/entry/two.png'])
  })

  it('ignores photos without a stored path', () => {
    expect(
      imagePathsOf({
        type: 'doc',
        content: [{ type: 'image', attrs: { src: 'https://x.y/z.png' } }],
      }),
    ).toEqual([])
  })
})

describe('plainTextOf', () => {
  it('keeps one line per block and line breaks inside a paragraph', () => {
    expect(plainTextOf(sampleDocument)).toBe(
      'Manhã\nCaminhei sem pressa\ne voltei.\nLigar\nDormir cedo',
    )
  })

  it('is empty for a blank page', () => {
    expect(plainTextOf({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe('')
  })
})

describe('image sources', () => {
  it('never keeps the signed address when saving', () => {
    const saved = withoutImageSources(sampleDocument)

    expect(JSON.stringify(saved)).not.toContain('token=')
    expect(saved.content?.[2]).toEqual({ type: 'image', attrs: { path: 'user/entry/one.png' } })
  })

  it('shows each photo from the signed address of its path and nothing else', () => {
    const shown = withImageSources(sampleDocument, {
      'user/entry/one.png': 'https://storage.local/one.png?token=fresh',
    })

    expect(shown.content?.[2]?.attrs).toEqual({
      path: 'user/entry/one.png',
      src: 'https://storage.local/one.png?token=fresh',
    })
    expect(shown.content?.[4]?.content?.[0]?.content?.[1]?.attrs).toEqual({
      path: 'user/entry/two.png',
      src: null,
    })
  })
})

describe('image sizes', () => {
  const sized = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          path: 'user/entry/one.webp',
          src: 'https://x.y/one.webp',
          width: 1600,
          height: 1200,
        },
      },
      { type: 'image', attrs: { path: 'user/entry/two.webp', width: 0, height: 'alto' } },
    ],
  }

  it('keeps the size of each photo so the page does not jump while it loads', () => {
    expect(withoutImageSources(sized).content?.map((node) => node.attrs)).toEqual([
      { path: 'user/entry/one.webp', width: 1600, height: 1200 },
      { path: 'user/entry/two.webp' },
    ])
    expect(withImageSources(sized, {}).content?.[0]?.attrs).toEqual({
      path: 'user/entry/one.webp',
      src: null,
      width: 1600,
      height: 1200,
    })
  })

  it('reads a size only when both sides are whole pixels', () => {
    expect(imageSizeOf({ width: 1024, height: 768 })).toEqual({ width: 1024, height: 768 })
    expect(imageSizeOf({ width: 1024.5, height: 768 })).toBeNull()
    expect(imageSizeOf({ width: 1024 })).toBeNull()
    expect(imageSizeOf(undefined)).toBeNull()
  })
})

describe('draftOf', () => {
  it('builds what is saved from the title and the document', () => {
    expect(draftOf('  Manhã de domingo  ', sampleDocument)).toEqual({
      title: 'Manhã de domingo',
      body: withoutImageSources(sampleDocument),
      plainText: 'Manhã\nCaminhei sem pressa\ne voltei.\nLigar\nDormir cedo',
      imagePaths: ['user/entry/one.png', 'user/entry/two.png'],
    })
  })

  it('saves an empty title as no title', () => {
    expect(draftOf('   ', sampleDocument).title).toBeNull()
  })

  it('knows when a page has nothing in it', () => {
    const blank = { type: 'doc', content: [{ type: 'paragraph' }] }

    expect(isBlankDraft(draftOf('', blank))).toBe(true)
    expect(isBlankDraft(draftOf('Título', blank))).toBe(false)
    expect(isBlankDraft(draftOf('', sampleDocument))).toBe(false)
  })
})

describe('journalDocumentOf', () => {
  it('accepts an editor document and refuses anything else', () => {
    expect(journalDocumentOf({ type: 'doc', content: [] })).toEqual({ type: 'doc', content: [] })
    expect(journalDocumentOf({ type: 'paragraph' })).toBeNull()
    expect(journalDocumentOf('texto')).toBeNull()
  })
})
