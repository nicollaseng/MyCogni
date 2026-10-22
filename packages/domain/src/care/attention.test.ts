import { describe, expect, it } from '@jest/globals'
import { attentionReasonsOf, type AttentionSignals } from './attention.ts'

const now = new Date('2026-10-15T12:00:00Z')

const calm: AttentionSignals = {
  latestDepression: { severity: 'mild', hasRiskFlag: false },
  latestAnxiety: { severity: 'minimal' },
  moodAverage: 4,
  previousMoodAverage: 4,
  lastCheckInAt: new Date('2026-10-14T20:00:00Z'),
  linkedAt: new Date('2026-09-01T12:00:00Z'),
  now,
}

describe('attentionReasonsOf', () => {
  it('asks for nothing when a patient is steady and recording', () => {
    expect(attentionReasonsOf(calm)).toEqual([])
  })

  it('puts a positive PHQ-9 item 9 first, whatever else is going on', () => {
    expect(
      attentionReasonsOf({
        ...calm,
        latestDepression: { severity: 'severe', hasRiskFlag: true },
        moodAverage: 1,
      }),
    ).toEqual(['risk_item', 'severe_screening', 'low_mood', 'mood_drop'])
  })

  it('flags moderately severe or severe screenings on either form', () => {
    expect(
      attentionReasonsOf({
        ...calm,
        latestDepression: { severity: 'moderately_severe', hasRiskFlag: false },
      }),
    ).toEqual(['severe_screening'])
    expect(attentionReasonsOf({ ...calm, latestAnxiety: { severity: 'severe' } })).toEqual([
      'severe_screening',
    ])
    expect(attentionReasonsOf({ ...calm, latestAnxiety: { severity: 'moderate' } })).toEqual([])
  })

  it('flags a low week and a drop of a whole point from the week before', () => {
    expect(attentionReasonsOf({ ...calm, moodAverage: 2, previousMoodAverage: 2.5 })).toEqual([
      'low_mood',
    ])
    expect(attentionReasonsOf({ ...calm, moodAverage: 3, previousMoodAverage: 4 })).toEqual([
      'mood_drop',
    ])
    expect(attentionReasonsOf({ ...calm, moodAverage: 3.5, previousMoodAverage: 4 })).toEqual([])
    expect(attentionReasonsOf({ ...calm, previousMoodAverage: null })).toEqual([])
  })

  it('flags seven days without records, counting from the link when there are none', () => {
    expect(
      attentionReasonsOf({
        ...calm,
        lastCheckInAt: new Date('2026-10-08T12:00:00Z'),
        moodAverage: null,
      }),
    ).toEqual(['inactive'])
    expect(
      attentionReasonsOf({
        ...calm,
        lastCheckInAt: null,
        moodAverage: null,
        linkedAt: new Date('2026-10-12T12:00:00Z'),
      }),
    ).toEqual([])
    expect(
      attentionReasonsOf({
        ...calm,
        latestDepression: null,
        latestAnxiety: null,
        lastCheckInAt: null,
        moodAverage: null,
        linkedAt: new Date('2026-10-01T12:00:00Z'),
      }),
    ).toEqual(['inactive'])
  })
})
