import { describe, expect, it } from '@jest/globals'
import { checkInLimits, maxMoodLevel } from './check-ins.ts'

describe('check-in limits', () => {
  it('uses the seven step mood scale, from 0 to 6', () => {
    expect(maxMoodLevel).toBe(6)
  })

  it('keeps tags and notes within a size a person actually writes', () => {
    expect(checkInLimits).toEqual({ tags: 12, tagLength: 40, note: 2000, addendum: 1000 })
  })
})
