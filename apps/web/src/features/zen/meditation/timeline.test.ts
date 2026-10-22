import { describe, expect, it } from '@jest/globals'
import { buildTimeline, itemAt } from './timeline'

const lines = [
  { index: 0, url: 'https://audio.test/0.mp3', seconds: 4 },
  { index: 2, url: 'https://audio.test/2.mp3', seconds: 6 },
]

describe('meditation timeline', () => {
  it('lays voice and silence one after the other', () => {
    const timeline = buildTimeline(
      [
        { index: 0, pause: 10 },
        { index: 2, pause: 0 },
        { index: 3, pause: 5 },
      ],
      lines,
    )

    expect(timeline.total).toBe(25)
    expect(timeline.items).toEqual([
      { kind: 'voice', index: 0, url: 'https://audio.test/0.mp3', start: 0, duration: 4 },
      { kind: 'silence', start: 4, duration: 10 },
      { kind: 'voice', index: 2, url: 'https://audio.test/2.mp3', start: 14, duration: 6 },
      { kind: 'silence', start: 20, duration: 5 },
    ])
  })

  it('finds what plays at a moment', () => {
    const timeline = buildTimeline([{ index: 0, pause: 10 }], lines)

    expect(itemAt(timeline, 0)?.kind).toBe('voice')
    expect(itemAt(timeline, 4)?.kind).toBe('silence')
    expect(itemAt(timeline, 14)).toBeNull()
  })
})
