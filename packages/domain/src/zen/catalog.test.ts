import { describe, expect, it } from '@jest/globals'
import {
  articleIds,
  isArticleId,
  isTrackId,
  isTrackStep,
  stepKinds,
  stepOf,
  trackIds,
  tracks,
} from './catalog.ts'
import { progressOf } from './progress.ts'

describe('tracks', () => {
  it.each(trackIds)('gives %s between four and seven steps with distinct ids', (id) => {
    const { steps } = tracks[id]

    expect(tracks[id].id).toBe(id)
    expect(steps.length).toBeGreaterThanOrEqual(4)
    expect(steps.length).toBeLessThanOrEqual(7)
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length)
  })

  it('uses only known step kinds and asks every track to read something', () => {
    for (const id of trackIds) {
      const kinds = tracks[id].steps.map((step) => step.kind)
      expect(kinds.every((kind) => stepKinds.includes(kind))).toBe(true)
      expect(kinds).toContain('read')
    }
  })

  it('points every article at least once from a track', () => {
    const read = trackIds.flatMap((id) =>
      tracks[id].steps.flatMap((step) => (step.kind === 'read' ? [step.article] : [])),
    )

    expect(new Set(read)).toEqual(new Set(articleIds))
  })

  it('sends the help track to the professionals and crisis lines early', () => {
    expect(tracks['seeking-help'].steps.map((step) => step.kind)).toEqual([
      'read',
      'support',
      'read',
      'write',
    ])
  })

  it('recognises tracks, articles and steps', () => {
    expect(isTrackId('low-mood')).toBe(true)
    expect(isTrackId('bipolar')).toBe(false)
    expect(isArticleId('worry-time')).toBe(true)
    expect(isArticleId('miracle-cure')).toBe(false)
    expect(isTrackStep('low-mood', 'questionnaires')).toBe(true)
    expect(isTrackStep('low-mood', 'breathe')).toBe(false)
    expect(isTrackStep('unknown', 'breathe')).toBe(false)
    expect(isTrackStep('low-mood', 5)).toBe(false)
    expect(stepOf('low-mood', 'questionnaires')).toEqual({
      id: 'questionnaires',
      kind: 'questionnaire',
    })
    expect(stepOf('low-mood', 'nothing')).toBeUndefined()
  })
})

describe('progressOf', () => {
  it('starts with nothing done and the first step next', () => {
    expect(progressOf('sleep-and-rest', [])).toEqual({
      done: [],
      total: 5,
      next: tracks['sleep-and-rest'].steps[0],
      started: false,
      complete: false,
    })
  })

  it('counts only the steps of the same track and moves to the first one left', () => {
    const progress = progressOf('everyday-anxiety', [
      { trackId: 'everyday-anxiety', stepId: 'read-anxiety-basics' },
      { trackId: 'everyday-anxiety', stepId: 'read-worry-time' },
      { trackId: 'sleep-and-rest', stepId: 'breathe' },
      { trackId: 'everyday-anxiety', stepId: 'retired-step' },
    ])

    expect(progress.done).toEqual(['read-anxiety-basics', 'read-worry-time'])
    expect(progress.next?.id).toBe('breathe')
    expect(progress.started).toBe(true)
    expect(progress.complete).toBe(false)
  })

  it('is complete once every step is done', () => {
    const progress = progressOf(
      'seeking-help',
      tracks['seeking-help'].steps.map((step) => ({ trackId: 'seeking-help', stepId: step.id })),
    )

    expect(progress.complete).toBe(true)
    expect(progress.next).toBeNull()
    expect(progress.done).toHaveLength(progress.total)
  })
})
