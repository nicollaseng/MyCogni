import { describe, expect, it } from '@jest/globals'
import {
  checkInFilterOf,
  entriesHref,
  entryHref,
  entryQuery,
  isFiltered,
  noFilters,
  parseEntryFilters,
  selectionOf,
} from './filters'

describe('entry filters', () => {
  it('reads the filters from the address and ignores what it does not know', () => {
    expect(
      parseEntryFilters({
        q: '  prazo ',
        period: '30',
        mood: '0-2',
        emotion: 'anxiety,luto',
        context: ['work,sleep', 'family'],
        note: '1',
      }),
    ).toEqual({
      q: 'prazo',
      period: '30',
      mood: { min: 0, max: 2 },
      emotions: ['anxiety', 'luto'],
      contexts: ['work', 'sleep'],
      withNote: true,
    })
    expect(
      parseEntryFilters({
        period: '365',
        mood: 'great',
        emotion: ' , ',
        context: ' ',
        note: 'yes',
      }),
    ).toEqual(noFilters)
    expect(parseEntryFilters({ q: 'a'.repeat(140), emotion: 'x'.repeat(41) })).toEqual({
      ...noFilters,
      q: 'a'.repeat(100),
    })
  })

  it('keeps links made with the earlier mood names working', () => {
    expect(parseEntryFilters({ mood: 'good' }).mood).toEqual({ min: 4, max: 6 })
  })

  it('never asks the API for more tags than a record can hold', () => {
    const many = Array.from({ length: 10 }, (_, index) => `t${String(index)}`).join(',')
    const filters = parseEntryFilters({ emotion: many, context: many })

    expect(filters.emotions).toHaveLength(10)
    expect(filters.contexts).toEqual(['t0', 't1'])
  })

  it('writes back only the filters in use, with the page and its size', () => {
    const filters = {
      ...noFilters,
      q: 'café',
      mood: { min: 4, max: 6 },
      contexts: ['work', 'sleep'],
      withNote: true,
    }

    expect(entryQuery(filters, { page: 3, size: 25 })).toEqual({
      q: 'café',
      mood: '4-6',
      context: 'work,sleep',
      note: '1',
      page: '3',
      size: '25',
    })
    expect(entriesHref(filters)).toBe('/entries?q=caf%C3%A9&mood=4-6&context=work%2Csleep&note=1')
    expect(entriesHref(noFilters)).toBe('/entries')
    expect(entriesHref(noFilters, { page: 1, size: 10 })).toBe('/entries')
    expect(entriesHref(noFilters, { page: 2, size: 50 })).toBe('/entries?page=2&size=50')
    expect(entryHref('abc', { ...noFilters, period: '7' })).toBe('/entries/abc?period=7')
    expect(entryHref('abc', noFilters, { page: 4, size: 10 })).toBe('/entries/abc?page=4')
    expect(entryHref('abc', noFilters)).toBe('/entries/abc')
  })

  it('knows when anything narrows the list', () => {
    expect(isFiltered(noFilters)).toBe(false)
    expect(isFiltered({ ...noFilters, q: 'chuva' })).toBe(true)
    expect(isFiltered({ ...noFilters, contexts: ['luto'] })).toBe(true)
    expect(isFiltered({ ...noFilters, emotions: ['calm'] })).toBe(true)
    expect(isFiltered({ ...noFilters, mood: { min: 3, max: 3 } })).toBe(true)
    expect(isFiltered({ ...noFilters, withNote: true })).toBe(true)
  })

  it('hands the selection to the shared filter rules', () => {
    expect(selectionOf({ ...noFilters, period: '30', emotions: ['calm'] })).toEqual({
      period: 30,
      mood: null,
      emotions: ['calm'],
      contexts: [],
      withNote: false,
    })
    expect(selectionOf(noFilters).period).toBeNull()
  })

  it('turns the filters into what the API understands', () => {
    const now = new Date('2026-10-15T12:00:00Z')

    expect(
      checkInFilterOf(
        {
          ...noFilters,
          q: 'ansied',
          period: '7',
          mood: { min: 0, max: 2 },
          emotions: ['luto'],
          contexts: ['work'],
        },
        { now, qTags: ['anxiety'] },
      ),
    ).toEqual({
      since: new Date('2026-10-08T12:00:00Z'),
      q: 'ansied',
      qTags: ['anxiety'],
      emotions: ['luto'],
      contexts: ['work'],
      minMood: 0,
      maxMood: 2,
      hasNote: undefined,
    })
    expect(checkInFilterOf({ ...noFilters, withNote: true }, { now, qTags: ['anxiety'] })).toEqual({
      since: undefined,
      q: undefined,
      qTags: undefined,
      emotions: [],
      contexts: [],
      minMood: undefined,
      maxMood: undefined,
      hasNote: true,
    })
  })
})
