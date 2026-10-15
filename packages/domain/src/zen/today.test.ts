import { describe, expect, it } from '@jest/globals'
import { trackIds, tracks } from './catalog.ts'
import type { DoneStep } from './progress.ts'
import { todayPick } from './today.ts'

function allOf(trackId: (typeof trackIds)[number]): DoneStep[] {
  return tracks[trackId].steps.map((step) => ({ trackId, stepId: step.id }))
}

describe('todayPick', () => {
  it('picks the first pending step of the first suggested track', () => {
    expect(todayPick(['everyday-anxiety', 'low-mood'], [])).toEqual({
      trackId: 'everyday-anxiety',
      step: tracks['everyday-anxiety'].steps[0],
      started: false,
    })
  })

  it('continues where the person stopped', () => {
    const pick = todayPick(
      ['sleep-and-rest'],
      [{ trackId: 'sleep-and-rest', stepId: 'read-sleep-and-mood' }],
    )
    expect(pick?.step.id).toBe('write-nights')
    expect(pick?.started).toBe(true)
  })

  it('moves to the next suggested track, then to any unfinished track', () => {
    expect(todayPick(['sleep-and-rest', 'low-mood'], allOf('sleep-and-rest'))?.trackId).toBe(
      'low-mood',
    )
    expect(todayPick(['sleep-and-rest'], allOf('sleep-and-rest'))?.trackId).toBe('everyday-anxiety')
  })

  it('has nothing left when every track is done', () => {
    expect(todayPick(['sleep-and-rest'], trackIds.flatMap(allOf))).toBeNull()
  })
})
