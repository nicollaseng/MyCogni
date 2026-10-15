import { describe, expect, it } from '@jest/globals'
import { tracks } from './catalog.ts'
import { articles } from './content/articles/articles.ts'
import { stepMinutes, trackMinutes } from './minutes.ts'
import { readingMinutes } from './reading.ts'

describe('stepMinutes', () => {
  it('uses the reading time for reads and a fixed estimate for the other steps', () => {
    expect(stepMinutes({ id: 'r', kind: 'read', article: 'anxiety-basics' }, 'pt-BR')).toBe(
      readingMinutes(articles['anxiety-basics'].text['pt-BR']),
    )
    expect(stepMinutes({ id: 'b', kind: 'breathe' }, 'en')).toBe(1)
    expect(stepMinutes({ id: 'w', kind: 'write' }, 'en')).toBe(5)
    expect(stepMinutes({ id: 'c', kind: 'check_in' }, 'en')).toBe(1)
    expect(stepMinutes({ id: 'f', kind: 'reflect' }, 'en')).toBe(2)
    expect(stepMinutes({ id: 'q', kind: 'questionnaire' }, 'en')).toBe(3)
    expect(stepMinutes({ id: 's', kind: 'support' }, 'en')).toBe(2)
  })
})

describe('trackMinutes', () => {
  it('adds up every step of the track', () => {
    const total = tracks['seeking-help'].steps.reduce(
      (sum, step) => sum + stepMinutes(step, 'pt-PT'),
      0,
    )
    expect(trackMinutes('seeking-help', 'pt-PT')).toBe(total)
    expect(total).toBeGreaterThan(5)
  })
})
