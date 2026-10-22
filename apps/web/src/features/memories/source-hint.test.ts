import { describe, expect, it } from '@jest/globals'
import type { Memory } from '@mycogni/contracts'
import { sourceHintOf } from './source-hint'

function learned(
  ...kinds: Memory['sources'][number]['kind'][]
): Pick<Memory, 'origin' | 'sources'> {
  return {
    origin: 'extracted',
    sources: kinds.map((kind, index) => ({ kind, at: `2026-10-1${String(index)}T12:00:00.000Z` })),
  }
}

describe('sourceHintOf', () => {
  it('says the person added it', () => {
    expect(sourceHintOf({ origin: 'manual', sources: [] })).toEqual({ key: 'manual' })
  })

  it('names where a learned memory first came from', () => {
    expect(sourceHintOf(learned('conversation', 'check_in'))).toEqual({ key: 'conversation' })
    expect(sourceHintOf(learned('journal'))).toEqual({ key: 'journal' })
    expect(sourceHintOf(learned('check_in'))).toEqual({
      key: 'checkIn',
      at: '2026-10-10T12:00:00.000Z',
    })
    expect(sourceHintOf(learned('addendum'))).toEqual({
      key: 'checkIn',
      at: '2026-10-10T12:00:00.000Z',
    })
  })

  it('shows no hint for a learned memory without sources', () => {
    expect(sourceHintOf({ origin: 'extracted', sources: [] })).toBeNull()
  })
})
