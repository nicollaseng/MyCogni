import { describe, expect, it } from '@jest/globals'
import {
  checkInFilterOf,
  entriesHref,
  entryQuery,
  isFiltered,
  noFilters,
  parseEntryFilters,
} from './filters'

describe('entry filters', () => {
  it('reads the filters from the address and ignores what it does not know', () => {
    expect(
      parseEntryFilters({
        q: '  prazo ',
        period: '30',
        mood: 'hard',
        emotion: 'anxiety',
        context: ['work', 'sleep'],
        note: '1',
      }),
    ).toEqual({
      q: 'prazo',
      period: '30',
      mood: 'hard',
      emotion: 'anxiety',
      context: 'work',
      withNote: true,
    })
    expect(
      parseEntryFilters({
        period: '365',
        mood: 'great',
        emotion: 'a,b',
        context: ' ',
        note: 'yes',
      }),
    ).toEqual(noFilters)
    expect(parseEntryFilters({ q: 'a'.repeat(140), emotion: 'x'.repeat(41) })).toEqual({
      ...noFilters,
      q: 'a'.repeat(100),
    })
  })

  it('writes back only the filters in use, keeping the page cursor', () => {
    const filters = { ...noFilters, q: 'café', mood: 'good' as const, withNote: true }

    expect(entryQuery(filters, '2026-10-01T12:00:00.000Z')).toEqual({
      q: 'café',
      mood: 'good',
      note: '1',
      before: '2026-10-01T12:00:00.000Z',
    })
    expect(entriesHref(filters)).toBe('/entries?q=caf%C3%A9&mood=good&note=1')
    expect(entriesHref(noFilters)).toBe('/entries')
  })

  it('knows when anything narrows the list', () => {
    expect(isFiltered(noFilters)).toBe(false)
    expect(isFiltered({ ...noFilters, q: 'chuva' })).toBe(true)
    expect(isFiltered({ ...noFilters, context: 'luto' })).toBe(true)
    expect(isFiltered({ ...noFilters, withNote: true })).toBe(true)
  })

  it('turns the filters into what the API understands', () => {
    const now = new Date('2026-10-15T12:00:00Z')

    expect(
      checkInFilterOf(
        { ...noFilters, q: 'ansied', period: '7', mood: 'hard', emotion: 'luto', context: 'work' },
        { now, qTags: ['anxiety'] },
      ),
    ).toEqual({
      since: new Date('2026-10-08T12:00:00Z'),
      q: 'ansied',
      qTags: ['anxiety'],
      tags: ['luto', 'work'],
      minMood: 0,
      maxMood: 2,
      hasNote: undefined,
    })
    expect(checkInFilterOf({ ...noFilters, withNote: true }, { now, qTags: ['anxiety'] })).toEqual({
      since: undefined,
      q: undefined,
      qTags: undefined,
      tags: [],
      minMood: undefined,
      maxMood: undefined,
      hasNote: true,
    })
  })
})
