import { describe, expect, it } from '@jest/globals'
import { daysSince, isScreeningDue } from './due'

const now = new Date('2026-10-29T12:00:00Z')

describe('screening cadence', () => {
  it('counts whole days since the last answer', () => {
    expect(daysSince('2026-10-15T13:00:00Z', now)).toBe(13)
    expect(daysSince('2026-10-15T11:00:00Z', now)).toBe(14)
  })

  it('suggests answering again after two weeks, or when never answered', () => {
    expect(isScreeningDue('2026-10-20T12:00:00Z', now)).toBe(false)
    expect(isScreeningDue('2026-10-15T12:00:00Z', now)).toBe(true)
    expect(isScreeningDue(undefined, now)).toBe(true)
  })
})
