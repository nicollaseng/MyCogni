import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { forgetDraft, isNewerDraft, readDraft, writeDraft, type PageDraft } from './drafts'

const entryId = '8a7d3c1e-0000-4000-8000-000000000001'

const draft: PageDraft = {
  base: '2026-10-15T15:00:00.000Z',
  writtenAt: Date.parse('2026-10-15T15:05:00.000Z'),
  title: 'Domingo',
  body: {
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Fui ao parque.' }] }],
  },
  imageUrls: { 'user/entry/one.webp': 'https://storage.local/one.webp?token=a' },
}

afterEach(() => {
  jest.restoreAllMocks()
  window.localStorage.clear()
})

describe('page drafts', () => {
  it('keeps a copy of the page on this device until it is forgotten', () => {
    expect(readDraft(entryId)).toBeNull()

    expect(writeDraft(entryId, draft)).toBe(true)
    expect(readDraft(entryId)).toEqual(draft)
    expect(readDraft('another-page')).toBeNull()

    expect(forgetDraft(entryId)).toBe(true)
    expect(readDraft(entryId)).toBeNull()
  })

  it('ignores a stored copy that is not a page', () => {
    window.localStorage.setItem(`mycogni.mybook.draft.${entryId}`, '{"title":3}')
    expect(readDraft(entryId)).toBeNull()
    window.localStorage.setItem(`mycogni.mybook.draft.${entryId}`, 'not json')
    expect(readDraft(entryId)).toBeNull()
  })

  it('keeps working when the browser refuses to store anything', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError')
    })
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError')
    })

    expect(writeDraft(entryId, draft)).toBe(false)
    expect(readDraft(entryId)).toBeNull()
    expect(forgetDraft(entryId)).toBe(false)
  })

  it('is newer when the server kept the version it was written on, or was written later', () => {
    expect(isNewerDraft({ updatedAt: draft.base }, draft)).toBe(true)
    expect(isNewerDraft({ updatedAt: '2026-10-15T15:01:00.000Z' }, draft)).toBe(true)
    expect(isNewerDraft({ updatedAt: '2026-10-15T15:10:00.000Z' }, draft)).toBe(false)
  })
})
