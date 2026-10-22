import { describe, expect, it } from '@jest/globals'
import {
  breathingContentId,
  intensityOf,
  isPracticeContent,
  isPracticeKind,
  isRecordable,
  practiceDays,
  practiceMap,
  practiceObservation,
  practiceTotals,
  readingCompleted,
  topPractices,
  type PracticeSession,
} from './practice.ts'

const timeZone = 'America/Sao_Paulo'

function session(
  startedAt: string,
  seconds: number,
  overrides: Partial<PracticeSession> = {},
): PracticeSession {
  return {
    kind: 'meditation',
    contentId: 'anxiety',
    startedAt,
    seconds,
    completed: true,
    feelingAfter: null,
    ...overrides,
  }
}

describe('practice sessions', () => {
  it('knows which content belongs to each kind', () => {
    expect(isPracticeContent('meditation', 'grief')).toBe(true)
    expect(isPracticeContent('breathing', breathingContentId)).toBe(true)
    expect(isPracticeContent('sound', 'calm')).toBe(true)
    expect(isPracticeContent('reading', 'worry-time')).toBe(true)
    expect(isPracticeContent('sound', 'grief')).toBe(false)
    expect(isPracticeKind('reading')).toBe(true)
    expect(isPracticeKind('walking')).toBe(false)
  })

  it('keeps a session after a finish or at least a minute, and a reading after ten seconds', () => {
    const base = { kind: 'meditation', contentId: 'focus' } as const
    expect(isRecordable({ ...base, seconds: 59, completed: false })).toBe(false)
    expect(isRecordable({ ...base, seconds: 60, completed: false })).toBe(true)
    expect(isRecordable({ ...base, seconds: 45, completed: true })).toBe(true)
    expect(isRecordable({ ...base, seconds: 0, completed: true })).toBe(false)
    expect(isRecordable({ ...base, seconds: 5 * 60 * 60, completed: true })).toBe(false)
    expect(isRecordable({ ...base, contentId: 'unknown', seconds: 300, completed: true })).toBe(
      false,
    )
    const reading = { kind: 'reading', contentId: 'worry-time' } as const
    expect(isRecordable({ ...reading, seconds: 9, completed: true })).toBe(false)
    expect(isRecordable({ ...reading, seconds: 10, completed: false })).toBe(true)
  })

  it('counts a reading as done at the end held for two seconds or when marked read', () => {
    expect(readingCompleted(1999, false)).toBe(false)
    expect(readingCompleted(2000, false)).toBe(true)
    expect(readingCompleted(0, true)).toBe(true)
  })

  it('maps minutes to five calm levels', () => {
    expect([0, 1, 4, 5, 14, 15, 29, 30, 90].map(intensityOf)).toEqual([0, 1, 1, 2, 2, 3, 3, 4, 4])
  })

  it('lays out whole weeks from Monday, ending with this week, in the person’s time zone', () => {
    const now = new Date('2026-10-22T15:00:00Z')
    const map = practiceMap(
      [
        session('2026-10-22T02:30:00Z', 600),
        session('2026-10-21T12:00:00Z', 1200),
        session('2026-10-21T13:00:00Z', 600),
        session('2026-09-01T12:00:00Z', 600),
        session('2026-09-02T12:00:00Z', 20),
      ],
      { now, timeZone, weeks: 8 },
    )

    expect(map).toHaveLength(56)
    expect(map[0]?.day).toBe('2026-08-31')
    expect(map.at(-1)?.day).toBe('2026-10-25')
    expect(map.find((day) => day.day === '2026-10-21')).toMatchObject({ minutes: 40, level: 4 })
    expect(map.find((day) => day.day === '2026-10-22')).toMatchObject({
      minutes: 0,
      future: false,
    })
    expect(map.find((day) => day.day === '2026-10-23')?.future).toBe(true)
    expect(map.find((day) => day.day === '2026-09-01')?.level).toBe(2)
    expect(map.find((day) => day.day === '2026-09-02')).toMatchObject({
      minutes: 0,
      level: 1,
      practised: true,
    })
    expect(practiceDays(map)).toBe(3)
  })

  it('adds up this week and this month', () => {
    const totals = practiceTotals(
      [
        session('2026-10-19T12:00:00Z', 300),
        session('2026-10-21T12:00:00Z', 610),
        session('2026-10-05T12:00:00Z', 1200),
        session('2026-09-30T12:00:00Z', 1200),
      ],
      { now: new Date('2026-10-22T15:00:00Z'), timeZone },
    )

    expect(totals.week).toEqual({ minutes: 15, sessions: 2 })
    expect(totals.month).toEqual({ minutes: 35, sessions: 3 })
  })

  it('lists the most used practices first', () => {
    const top = topPractices(
      [
        session('2026-10-19T12:00:00Z', 300),
        session('2026-10-20T12:00:00Z', 300),
        session('2026-10-21T12:00:00Z', 1800, { kind: 'sound', contentId: 'sleep' }),
        session('2026-10-21T13:00:00Z', 64, { kind: 'breathing', contentId: breathingContentId }),
      ],
      2,
    )

    expect(top).toEqual([
      { kind: 'meditation', contentId: 'anxiety', sessions: 2, minutes: 10 },
      { kind: 'sound', contentId: 'sleep', sessions: 1, minutes: 30 },
    ])
  })

  describe('observation after practice', () => {
    const checkIns = Array.from({ length: 6 }, (_, index) => ({
      moodLevel: 2,
      recordedAt: new Date(`2026-10-1${String(index)}T13:00:00Z`),
    }))

    function practised(feeling: number, count = 6) {
      return Array.from({ length: count }, (_, index) =>
        session(`2026-10-1${String(index)}T20:00:00Z`, 300, { feelingAfter: feeling }),
      )
    }

    it('says nothing until there are five comparable sessions', () => {
      expect(practiceObservation(practised(4, 4), checkIns, timeZone)).toBeNull()
      expect(
        practiceObservation(
          [...practised(4, 4), session('2026-10-01T20:00:00Z', 300)],
          checkIns,
          timeZone,
        ),
      ).toBeNull()
    })

    it('notices feeling a little better or about the same after practising', () => {
      expect(practiceObservation(practised(3), checkIns, timeZone)).toBe('better')
      expect(practiceObservation(practised(2), checkIns, timeZone)).toBe('same')
    })

    it('stays quiet when the person tends to feel worse', () => {
      expect(practiceObservation(practised(1), checkIns, timeZone)).toBeNull()
    })
  })
})
