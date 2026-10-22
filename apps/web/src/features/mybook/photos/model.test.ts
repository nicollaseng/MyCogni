import { describe, expect, it } from '@jest/globals'
import type { JournalPhoto } from '@mycogni/contracts'
import { mergePhotos, photoKey, photosByMonth } from './model'

function photo(path: string, writtenAt: string, entryId = '8a7d3c1e-0000-4000-8000-000000000001') {
  return {
    entryId,
    entryTitle: 'Praia',
    writtenAt,
    position: 1,
    path,
    url: null,
    caption: '',
    width: null,
    height: null,
  } satisfies JournalPhoto
}

describe('photo grid model', () => {
  it('groups photos by the month of their page, in the person time zone', () => {
    const photos = [
      photo('a.jpg', '2026-11-01T01:00:00.000Z'),
      photo('b.jpg', '2026-10-20T12:00:00.000Z'),
      photo('c.jpg', '2026-10-02T12:00:00.000Z'),
      photo('d.jpg', '2026-09-30T12:00:00.000Z'),
    ]

    expect(
      photosByMonth(photos, 'America/Sao_Paulo').map((month) => [
        month.key,
        month.photos.map((item) => item.path),
      ]),
    ).toEqual([
      ['2026-10', ['a.jpg', 'b.jpg', 'c.jpg']],
      ['2026-09', ['d.jpg']],
    ])
  })

  it('adds a new batch without repeating photos already shown', () => {
    const first = [photo('a.jpg', '2026-10-20T12:00:00.000Z')]
    const next = [
      photo('a.jpg', '2026-10-20T12:00:00.000Z'),
      photo('b.jpg', '2026-10-19T12:00:00.000Z'),
    ]

    expect(mergePhotos(first, next).map((item) => item.path)).toEqual(['a.jpg', 'b.jpg'])
    expect(photoKey(first[0] ?? photo('x', ''))).toBe('8a7d3c1e-0000-4000-8000-000000000001:a.jpg')
  })
})
