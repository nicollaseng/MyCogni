import { describe, expect, it } from '@jest/globals'
import {
  durationOf,
  expiresAtOf,
  firstDayToChoose,
  matchingPages,
  shareStateOf,
  startOfDay,
} from './sharing'
import { now, shareOf, summaryOf, timeZone } from './test-data'

describe('share duration', () => {
  it('ends seven or thirty days from now', () => {
    const week = durationOf('week', '', now, timeZone)
    const month = durationOf('month', '', now, timeZone)

    expect(week && expiresAtOf(week, now, timeZone)?.toISOString()).toBe('2026-10-22T15:00:00.000Z')
    expect(month && expiresAtOf(month, now, timeZone)?.toISOString()).toBe(
      '2026-11-14T15:00:00.000Z',
    )
  })

  it('lasts until the end of the chosen day where the person lives', () => {
    const until = durationOf('until', '2026-10-20', now, timeZone)

    expect(until && expiresAtOf(until, now, timeZone)?.toISOString()).toBe(
      '2026-10-21T02:59:59.999Z',
    )
  })

  it('follows summer time when computing the end of a day', () => {
    expect(startOfDay('2026-10-25', 'Europe/Lisbon').toISOString()).toBe('2026-10-24T23:00:00.000Z')
    expect(startOfDay('2026-10-26', 'Europe/Lisbon').toISOString()).toBe('2026-10-26T00:00:00.000Z')
  })

  it('has no end when chosen without a deadline', () => {
    const forever = durationOf('forever', '', now, timeZone)

    expect(forever).toEqual({ kind: 'forever' })
    expect(forever && expiresAtOf(forever, now, timeZone)).toBeNull()
  })

  it('only accepts dates from tomorrow on', () => {
    expect(firstDayToChoose(now, timeZone)).toBe('2026-10-16')
    expect(durationOf('until', '2026-10-15', now, timeZone)).toBeNull()
    expect(durationOf('until', '', now, timeZone)).toBeNull()
    expect(durationOf('until', '2026-10-16', now, timeZone)).toEqual({
      kind: 'until',
      day: '2026-10-16',
    })
  })
})

describe('shareStateOf', () => {
  it('says nothing is shared when every share ended', () => {
    expect(shareStateOf([], now)).toEqual({ kind: 'none' })
    expect(
      shareStateOf(
        [
          shareOf({ revokedAt: '2026-10-14T10:00:00.000Z' }),
          shareOf({ expiresAt: '2026-10-15T14:59:00.000Z' }),
        ],
        now,
      ),
    ).toEqual({ kind: 'none' })
  })

  it('counts the distinct pages shared right now', () => {
    expect(
      shareStateOf(
        [
          shareOf({ entryIds: ['a', 'b'] }),
          shareOf({ entryIds: ['b', 'c'], expiresAt: null }),
          shareOf({ entryIds: ['d'], revokedAt: '2026-10-14T10:00:00.000Z' }),
        ],
        now,
      ),
    ).toEqual({ kind: 'entries', count: 3 })
  })

  it('prefers the whole journal and its latest end', () => {
    expect(
      shareStateOf(
        [
          shareOf(),
          shareOf({ scope: 'all', entryIds: [], expiresAt: '2026-10-20T10:00:00.000Z' }),
          shareOf({ scope: 'all', entryIds: [], expiresAt: '2026-11-01T10:00:00.000Z' }),
        ],
        now,
      ),
    ).toEqual({ kind: 'all', until: new Date('2026-11-01T10:00:00.000Z') })
    expect(
      shareStateOf(
        [
          shareOf({ scope: 'all', entryIds: [], expiresAt: '2026-11-01T10:00:00.000Z' }),
          shareOf({ scope: 'all', entryIds: [], expiresAt: null }),
        ],
        now,
      ),
    ).toEqual({ kind: 'all', until: null })
  })
})

describe('matchingPages', () => {
  it('finds pages by title or excerpt, ignoring case and accents', () => {
    const pages = [
      summaryOf({ id: 'a', title: 'Conversa difícil', excerpt: 'Reunião' }),
      summaryOf({ id: 'b', title: null, excerpt: 'Choveu a tarde toda' }),
    ]

    expect(matchingPages(pages, 'DIFICIL').map((page) => page.id)).toEqual(['a'])
    expect(matchingPages(pages, 'reuniao').map((page) => page.id)).toEqual(['a'])
    expect(matchingPages(pages, 'chov').map((page) => page.id)).toEqual(['b'])
    expect(matchingPages(pages, '  ')).toHaveLength(2)
  })
})
