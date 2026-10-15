import { describe, expect, it } from '@jest/globals'
import {
  associationDays,
  isUnlocked,
  patternUnlocks,
  pendingSections,
  type PatternEvidence,
} from './unlocks.ts'

const newcomer: PatternEvidence = {
  periodDays: 30,
  recordedDays: 3,
  checkIns: 3,
  comparableContexts: 0,
  scoreSessions: 1,
  summary: { ready: false, enabled: true, recorded: 3 },
}

const regular: PatternEvidence = {
  periodDays: 30,
  recordedDays: 26,
  checkIns: 31,
  comparableContexts: 2,
  scoreSessions: 3,
  summary: { ready: true, enabled: true, recorded: 31 },
}

describe('patternUnlocks', () => {
  it('shows what is still on the way, with progress, for someone just starting', () => {
    expect(patternUnlocks(newcomer)).toEqual([
      { section: 'summary', state: 'progress', current: 3, required: 7, unit: 'records' },
      { section: 'weekdays', state: 'progress', current: 3, required: 14, unit: 'days' },
      { section: 'frequent', state: 'progress', current: 3, required: 5, unit: 'records' },
      { section: 'associations', state: 'progress', current: 3, required: 8, unit: 'days' },
      { section: 'scores', state: 'progress', current: 1, required: 2, unit: 'answers' },
    ])
  })

  it('unlocks every section once there is enough data', () => {
    const statuses = patternUnlocks(regular)

    expect(statuses.every((status) => status.state === 'ready')).toBe(true)
    expect(pendingSections(statuses)).toEqual([])
    expect(isUnlocked(statuses, 'associations')).toBe(true)
  })

  it('leaves out what a short period can never show', () => {
    const statuses = patternUnlocks({ ...regular, periodDays: 7, recordedDays: 7 })

    expect(statuses.map((status) => status.section)).toEqual(['summary', 'frequent', 'scores'])
    expect(isUnlocked(statuses, 'weekdays')).toBe(false)
    expect(associationDays).toBe(8)
  })

  it('asks for contexts when there are enough days but nothing to compare', () => {
    const [, , , associations] = patternUnlocks({
      ...newcomer,
      recordedDays: 12,
      comparableContexts: 0,
    })

    expect(associations).toEqual({ section: 'associations', state: 'blocked', reason: 'contexts' })
  })

  it('leaves automatic summaries out when they are off and caps the progress at the threshold', () => {
    const off = patternUnlocks({
      ...newcomer,
      summary: { ready: false, enabled: false, recorded: 9 },
    })
    const [waiting] = patternUnlocks({
      ...newcomer,
      summary: { ready: false, enabled: true, recorded: 9 },
    })

    expect(off.map((status) => status.section)).not.toContain('summary')
    expect(waiting).toEqual(expect.objectContaining({ current: 7, required: 7 }))
  })
})
