import { describe, expect, it } from '@jest/globals'
import {
  excerptOf,
  isJournalImageType,
  isOwnJournalPath,
  isShareActive,
  journalImageExtension,
} from './journal.ts'

const user = '6f1c4a52-61f7-4c1b-9d3c-1b0d2a4f2a10'
const entry = '0b8f7d2e-4c1a-4e7b-9a55-3c2d1e0f9a88'
const image = 'd2c7a3b1-5e6f-4a8b-9c0d-1e2f3a4b5c6d'

describe('journal images', () => {
  it('accepts the photo formats of phones and the web, with their extension', () => {
    expect(isJournalImageType('image/jpeg')).toBe(true)
    expect(isJournalImageType('image/heic')).toBe(false)
    expect(isJournalImageType('application/pdf')).toBe(false)
    expect(journalImageExtension('image/webp')).toBe('webp')
  })

  it('keeps every image inside the folder of its owner and entry', () => {
    expect(isOwnJournalPath(`${user}/${entry}/${image}.jpg`, user, entry)).toBe(true)
    expect(isOwnJournalPath(`${entry}/${user}/${image}.jpg`, user, entry)).toBe(false)
    expect(isOwnJournalPath(`${user}/${entry}/../${image}.jpg`, user, entry)).toBe(false)
    expect(isOwnJournalPath(`${user}/${entry}/${image}.exe`, user, entry)).toBe(false)
  })
})

describe('excerptOf', () => {
  it('shows the beginning of a page on one line', () => {
    expect(excerptOf('Hoje   acordei\n\ncedo.')).toBe('Hoje acordei cedo.')
    expect(excerptOf('a'.repeat(200), 10)).toBe('aaaaaaaaa…')
  })
})

describe('isShareActive', () => {
  const now = new Date('2026-10-15T12:00:00Z')

  it('is active until it is revoked or reaches its end', () => {
    expect(isShareActive({ revokedAt: null, expiresAt: null }, now)).toBe(true)
    expect(
      isShareActive({ revokedAt: null, expiresAt: new Date('2026-10-16T00:00:00Z') }, now),
    ).toBe(true)
    expect(
      isShareActive({ revokedAt: null, expiresAt: new Date('2026-10-15T11:59:00Z') }, now),
    ).toBe(false)
    expect(
      isShareActive({ revokedAt: new Date('2026-10-14T00:00:00Z'), expiresAt: null }, now),
    ).toBe(false)
  })
})
