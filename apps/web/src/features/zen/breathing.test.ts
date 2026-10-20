import { describe, expect, it } from '@jest/globals'
import { advance, elapsedOf, exerciseMs, idleRun, momentAt, roundMs } from './breathing'

describe('box breathing', () => {
  it('lasts four rounds of four phases of four seconds', () => {
    expect(exerciseMs).toBe(64_000)
    expect(roundMs).toBe(16_000)
  })

  it.each([
    [0, 'inhale', 4, 1],
    [999, 'inhale', 4, 1],
    [1000, 'inhale', 3, 1],
    [3999, 'inhale', 1, 1],
    [4000, 'holdIn', 4, 1],
    [8000, 'exhale', 4, 1],
    [12_000, 'holdOut', 4, 1],
    [16_000, 'inhale', 4, 2],
    [63_999, 'holdOut', 1, 4],
    [90_000, 'holdOut', 1, 4],
  ])('at %p ms says %p with %p left in round %p', (elapsed, phase, count, round) => {
    expect(momentAt(elapsed)).toMatchObject({ phase, count, round })
  })

  it('counts an extra round when there is one more to go', () => {
    expect(momentAt(64_000, 5)).toEqual({ phase: 'inhale', count: 4, round: 5 })
    expect(momentAt(90_000, 5)).toEqual({ phase: 'holdOut', count: 1, round: 5 })
  })
})

describe('a breathing run', () => {
  it('keeps time from the clock, pauses without losing its place and resumes', () => {
    const started = advance(idleRun, { type: 'start', now: 1000 })
    expect(started).toMatchObject({ status: 'running', run: 1 })

    const later = advance(started, { type: 'tick', now: 6000 })
    expect(elapsedOf(later)).toBe(5000)

    const paused = advance(later, { type: 'pause', now: 6080 })
    expect(paused.status).toBe('paused')
    expect(elapsedOf(advance(paused, { type: 'tick', now: 60_000 }))).toBe(5080)

    const resumed = advance(paused, { type: 'resume', now: 70_000 })
    expect(elapsedOf(advance(resumed, { type: 'tick', now: 71_000 }))).toBe(6080)
    expect(resumed.run).toBe(1)
  })

  it('finishes after four rounds and can go one more round', () => {
    const started = advance(idleRun, { type: 'start', now: 0 })
    const finished = advance(started, { type: 'tick', now: exerciseMs + 40 })
    expect(finished).toMatchObject({ status: 'finished', base: exerciseMs })

    const more = advance(finished, { type: 'more', now: 100_000 })
    expect(more).toMatchObject({ status: 'running', rounds: 5, run: 2 })
    expect(momentAt(elapsedOf(more), more.rounds)).toEqual({ phase: 'inhale', count: 4, round: 5 })

    const done = advance(more, { type: 'tick', now: 100_000 + roundMs })
    expect(done).toMatchObject({ status: 'finished', base: exerciseMs + roundMs })
  })

  it('ignores actions that do not fit the current state', () => {
    expect(advance(idleRun, { type: 'pause', now: 5 })).toBe(idleRun)
    expect(advance(idleRun, { type: 'resume', now: 5 })).toBe(idleRun)
    expect(advance(idleRun, { type: 'more', now: 5 })).toBe(idleRun)
    expect(advance(idleRun, { type: 'tick', now: 5 })).toBe(idleRun)
  })
})
