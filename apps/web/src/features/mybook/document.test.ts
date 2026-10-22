import { describe, expect, it } from '@jest/globals'
import {
  draftOf,
  flattenGalleries,
  galleryPhotosOf,
  groupGalleries,
  imagePathsOf,
  imageSizeOf,
  isBlankDraft,
  journalDocumentOf,
  plainTextOf,
  storedBodyOf,
  withImageSources,
  withoutPhoto,
  withPhotoCaption,
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

const captioned = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Praia' }] },
    {
      type: 'image',
      attrs: { path: 'user/entry/one.webp', width: 800, height: 1000, caption: 'Pôr do sol' },
    },
    { type: 'image', attrs: { path: 'user/entry/two.webp', caption: '  ' } },
    { type: 'image', attrs: { path: 'user/entry/three.webp', caption: 'Areia quente' } },
    { type: 'paragraph', content: [{ type: 'text', text: 'Voltamos cedo.' }] },
    { type: 'image', attrs: { path: 'user/entry/four.webp' } },
  ],
}

describe('photo captions', () => {
  it('reads captions as part of the page text, where each photo stands', () => {
    expect(plainTextOf(captioned)).toBe('Praia\nPôr do sol\nAreia quente\nVoltamos cedo.')
  })

  it('keeps the photo paths exactly as before', () => {
    expect(imagePathsOf(captioned)).toEqual([
      'user/entry/one.webp',
      'user/entry/two.webp',
      'user/entry/three.webp',
      'user/entry/four.webp',
    ])
  })

  it('stores a caption without the signed address and drops empty ones', () => {
    const saved = withoutImageSources(
      withImageSources(captioned, { 'user/entry/one.webp': 'https://x.y/one.webp?token=t' }),
    )

    expect(saved.content?.[1]?.attrs).toEqual({
      path: 'user/entry/one.webp',
      width: 800,
      height: 1000,
      caption: 'Pôr do sol',
    })
    expect(saved.content?.[2]?.attrs).toEqual({ path: 'user/entry/two.webp' })
  })
})

describe('galleries', () => {
  it('shows each run of photos as one gallery and leaves the rest alone', () => {
    const grouped = groupGalleries(withImageSources(captioned, {}))

    expect(grouped.content?.map((node) => node.type)).toEqual([
      'paragraph',
      'gallery',
      'paragraph',
      'gallery',
    ])
    expect(galleryPhotosOf(grouped.content?.[1]?.attrs?.photos)).toEqual([
      { path: 'user/entry/one.webp', src: null, width: 800, height: 1000, caption: 'Pôr do sol' },
      { path: 'user/entry/two.webp', src: null, width: null, height: null, caption: '' },
      {
        path: 'user/entry/three.webp',
        src: null,
        width: null,
        height: null,
        caption: 'Areia quente',
      },
    ])
  })

  it('groups photos inside lists too', () => {
    const grouped = groupGalleries(sampleDocument)
    const item = grouped.content?.[4]?.content?.[0]

    expect(item?.content?.map((node) => node.type)).toEqual(['paragraph', 'gallery'])
  })

  it('saves galleries back as the same photos, so older pages and clients still read them', () => {
    const stored = withoutImageSources(captioned)

    expect(withoutImageSources(flattenGalleries(groupGalleries(stored)))).toEqual(stored)
    expect(draftOf('Praia', groupGalleries(withImageSources(captioned, {})))).toEqual(
      draftOf('Praia', captioned),
    )
    expect(storedBodyOf(groupGalleries(stored))).toEqual(flattenGalleries(groupGalleries(stored)))
    expect(storedBodyOf('texto')).toBe('texto')
  })

  it('ignores gallery data that is not a list of photos', () => {
    expect(galleryPhotosOf([{ path: 1 }])).toEqual([])
    expect(
      flattenGalleries({ type: 'doc', content: [{ type: 'gallery', attrs: { photos: 'x' } }] }),
    ).toEqual({ type: 'doc', content: [] })
  })
})

describe('changing one photo of a stored page', () => {
  it('changes the caption of the photo with that path only', () => {
    const changed = withPhotoCaption(captioned, 'user/entry/two.webp', 'Ondas')

    expect(plainTextOf(changed)).toBe('Praia\nPôr do sol\nOndas\nAreia quente\nVoltamos cedo.')
    expect(imagePathsOf(changed)).toEqual(imagePathsOf(captioned))
  })

  it('removes the photo with that path, wherever it is', () => {
    expect(imagePathsOf(withoutPhoto(captioned, 'user/entry/three.webp'))).toEqual([
      'user/entry/one.webp',
      'user/entry/two.webp',
      'user/entry/four.webp',
    ])
    expect(imagePathsOf(withoutPhoto(sampleDocument, 'user/entry/two.png'))).toEqual([
      'user/entry/one.png',
    ])
  })
})
