import { describe, expect, it } from '@jest/globals'
import {
  activeFilterCount,
  filterParts,
  moodRangeOf,
  moodRangeParam,
  tagListOf,
  toggleMoodLevel,
  type EntryFilterSelection,
} from './entry-filters.ts'

const none: EntryFilterSelection = {
  period: null,
  mood: null,
  emotions: [],
  contexts: [],
  withNote: false,
}

describe('moodRangeOf', () => {
  it('reads a single level or a range of the scale', () => {
    expect(moodRangeOf('2')).toEqual({ min: 2, max: 2 })
    expect(moodRangeOf('0-2')).toEqual({ min: 0, max: 2 })
  })

  it('still understands the earlier named ranges', () => {
    expect(moodRangeOf('hard')).toEqual({ min: 0, max: 2 })
    expect(moodRangeOf('neutral')).toEqual({ min: 3, max: 3 })
    expect(moodRangeOf('good')).toEqual({ min: 4, max: 6 })
  })

  it('ignores anything outside the scale', () => {
    expect(moodRangeOf(undefined)).toBeNull()
    expect(moodRangeOf('')).toBeNull()
    expect(moodRangeOf('3-1')).toBeNull()
    expect(moodRangeOf('2-7')).toBeNull()
    expect(moodRangeOf('toString')).toBeNull()
  })

  it('writes the range back for the address', () => {
    expect(moodRangeParam({ min: 4, max: 4 })).toBe('4')
    expect(moodRangeParam({ min: 0, max: 2 })).toBe('0-2')
  })
})

describe('toggleMoodLevel', () => {
  it('starts, widens and clears a continuous range', () => {
    const started = toggleMoodLevel(null, 2)
    expect(started).toEqual({ min: 2, max: 2 })
    expect(toggleMoodLevel(started, 0)).toEqual({ min: 0, max: 2 })
    expect(toggleMoodLevel(started, 4)).toEqual({ min: 2, max: 4 })
    expect(toggleMoodLevel(started, 2)).toBeNull()
  })

  it('shrinks from the ends and narrows to a level picked inside', () => {
    const range = { min: 1, max: 4 }
    expect(toggleMoodLevel(range, 1)).toEqual({ min: 2, max: 4 })
    expect(toggleMoodLevel(range, 4)).toEqual({ min: 1, max: 3 })
    expect(toggleMoodLevel(range, 3)).toEqual({ min: 3, max: 3 })
  })
})

describe('tagListOf', () => {
  it('splits, trims and removes repeated or invalid tags up to the limit', () => {
    expect(tagListOf(' work, sleep ,work,,')).toEqual(['work', 'sleep'])
    expect(tagListOf(`${'x'.repeat(41)},calm`)).toEqual(['calm'])
    expect(tagListOf('a,b,c', 2)).toEqual(['a', 'b'])
    expect(tagListOf(undefined)).toEqual([])
  })
})

describe('filterParts', () => {
  it('lists the active filters in reading order and counts them', () => {
    const selection: EntryFilterSelection = {
      period: 30,
      mood: { min: 0, max: 2 },
      emotions: ['anxiety'],
      contexts: ['work', 'sleep'],
      withNote: true,
    }

    expect(filterParts(selection)).toEqual([
      { kind: 'period', days: 30 },
      { kind: 'mood', min: 0, max: 2 },
      { kind: 'emotion', tag: 'anxiety' },
      { kind: 'context', tag: 'work' },
      { kind: 'context', tag: 'sleep' },
      { kind: 'note' },
    ])
    expect(activeFilterCount(selection)).toBe(6)
    expect(activeFilterCount(none)).toBe(0)
    expect(filterParts(none)).toEqual([])
  })
})
