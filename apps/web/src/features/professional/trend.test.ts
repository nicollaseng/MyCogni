import { describe, expect, it } from '@jest/globals'
import { moodTrend } from './trend'

describe('moodTrend', () => {
  it('has nothing to compare without both weeks', () => {
    expect(moodTrend(null, 3)).toBeNull()
    expect(moodTrend(4.2, null)).toBeNull()
  })

  it('points up or down once the change reaches half a point', () => {
    expect(moodTrend(4.5, 3)).toEqual({ delta: 1.5, direction: 'up' })
    expect(moodTrend(2.4, 3.4)).toEqual({ delta: -1, direction: 'down' })
    expect(moodTrend(3.5, 3)).toEqual({ delta: 0.5, direction: 'up' })
  })

  it('calls smaller changes steady and rounds the delta to one decimal', () => {
    expect(moodTrend(3.3, 3)).toEqual({ delta: 0.3, direction: 'steady' })
    expect(moodTrend(2.6, 3)).toEqual({ delta: -0.4, direction: 'steady' })
  })
})
