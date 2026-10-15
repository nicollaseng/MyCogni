import { describe, expect, it } from '@jest/globals'
import { firstSentence, isRecentReading, readingAnchor, readingIdOfHash } from './readings'

describe('firstSentence', () => {
  it('keeps decimals and stops at the first full stop', () => {
    expect(
      firstSentence(
        '  O humor médio subiu de 3,0 para 4,1 na semana. O trabalho ainda pesa.',
        'pt-BR',
      ),
    ).toBe('O humor médio subiu de 3,0 para 4,1 na semana.')
  })

  it('returns the whole text when there is a single sentence', () => {
    expect(firstSentence('Average mood rose to 4.1', 'en-US')).toBe('Average mood rose to 4.1')
  })
})

describe('isRecentReading', () => {
  const now = new Date('2026-10-15T12:00:00Z')

  it('counts readings from the last 14 days', () => {
    expect(isRecentReading('2026-10-01T12:00:00Z', now)).toBe(true)
    expect(isRecentReading('2026-10-01T11:59:00Z', now)).toBe(false)
  })
})

describe('reading anchors', () => {
  it('finds the reading a link points to', () => {
    const id = '6f1c2d3e-4b5a-4c6d-8e7f-000000000014'

    expect(readingIdOfHash(`#${readingAnchor(id)}`)).toBe(id)
    expect(readingIdOfHash('#reading-')).toBeNull()
    expect(readingIdOfHash('#scores')).toBeNull()
  })
})
