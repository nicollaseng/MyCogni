import { describe, expect, it } from '@jest/globals'
import { captionOf, isCaptionText, journalCaptions } from './captions.ts'

describe('photo captions', () => {
  it('accepts plain text up to 500 characters', () => {
    expect(isCaptionText('Praia com a minha irmã')).toBe(true)
    expect(isCaptionText('eu <3 o mar, 2 < 3 e 5 > 4')).toBe(true)
    expect(isCaptionText('a'.repeat(500))).toBe(true)
  })

  it('refuses markup, long text and anything that is not text', () => {
    expect(isCaptionText('<b>praia</b>')).toBe(false)
    expect(isCaptionText('antes <img src=x onerror=alert(1)> depois')).toBe(false)
    expect(isCaptionText('</p>')).toBe(false)
    expect(isCaptionText('a'.repeat(501))).toBe(false)
    expect(isCaptionText(42)).toBe(false)
    expect(isCaptionText(null)).toBe(false)
  })

  it('reads a trimmed caption or nothing', () => {
    expect(captionOf({ caption: '  Pôr do sol  ' })).toBe('Pôr do sol')
    expect(captionOf({ caption: '<i>x</i>' })).toBe('')
    expect(captionOf({})).toBe('')
    expect(captionOf(undefined)).toBe('')
  })

  it('collects the captions of every photo in a page', () => {
    const page = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Dia de sol' }] },
        { type: 'image', attrs: { path: 'a.jpg', caption: 'Praia' } },
        { type: 'image', attrs: { path: 'b.jpg' } },
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [{ type: 'image', attrs: { caption: 'Mar' } }] }],
        },
      ],
    }

    expect(journalCaptions(page)).toEqual(['Praia', 'Mar'])
  })
})
