import { describe, expect, it } from '@jest/globals'
import { tracks } from './catalog.ts'
import { isTopicId, topicIds, topics } from './topics.ts'

describe('topics', () => {
  it('maps each need to its own track and to reads the track uses or supports', () => {
    const covered = topicIds.map((id) => topics[id].track)
    expect(new Set(covered).size).toBe(topicIds.length)
    for (const id of topicIds) {
      expect(topics[id].id).toBe(id)
      const trackReads = tracks[topics[id].track].steps.flatMap((step) =>
        step.kind === 'read' ? [step.article] : [],
      )
      expect(topics[id].articles).toContain(trackReads[0])
    }
  })

  it('recognises topic ids only', () => {
    expect(isTopicId('sleep')).toBe(true)
    expect(isTopicId('sono')).toBe(false)
    expect(isTopicId(undefined)).toBe(false)
  })
})
