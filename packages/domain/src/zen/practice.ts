import { dayKey, previousDays, type DatedMood } from '../check-ins/days.ts'
import { levelsByDay, meanOf, weekdayOf } from '../patterns/days.ts'
import { isArticleId } from './catalog.ts'
import { isMeditationId } from './meditation-ids.ts'
import { isSoundProgrammeId } from './sounds.ts'

export const practiceKinds = ['meditation', 'breathing', 'sound', 'reading'] as const

export type PracticeKind = (typeof practiceKinds)[number]

export const breathingContentId = 'box-breathing'

export const practiceMinimumSeconds: Readonly<Record<PracticeKind, number>> = {
  meditation: 60,
  breathing: 60,
  sound: 60,
  reading: 10,
}

export const practiceMaximumSeconds = 4 * 60 * 60

export const readingEndDwellMs = 2000

export const practiceMapWeeks = { summary: 8, full: 12 } as const

export const intensityMinutes = [1, 5, 15, 30] as const

export const observationMinimumPairs = 5

export const observationThreshold = 0.5

export interface PracticeAttempt {
  kind: PracticeKind
  contentId: string
  seconds: number
  completed: boolean
}

export interface PracticeSession extends PracticeAttempt {
  startedAt: string
  feelingAfter: number | null
}

export interface PracticeDay {
  day: string
  minutes: number
  level: 0 | 1 | 2 | 3 | 4
  practised: boolean
  future: boolean
}

export interface PracticeTotals {
  minutes: number
  sessions: number
}

export interface PracticeUse {
  kind: PracticeKind
  contentId: string
  sessions: number
  minutes: number
}

export type PracticeObservation = 'better' | 'same' | null

export function isPracticeKind(value: unknown): value is PracticeKind {
  return practiceKinds.some((kind) => kind === value)
}

export function isPracticeContent(kind: PracticeKind, contentId: string): boolean {
  switch (kind) {
    case 'meditation':
      return isMeditationId(contentId)
    case 'breathing':
      return contentId === breathingContentId
    case 'sound':
      return isSoundProgrammeId(contentId)
    case 'reading':
      return isArticleId(contentId)
  }
}

export function isRecordable({ kind, contentId, seconds, completed }: PracticeAttempt): boolean {
  if (!isPracticeContent(kind, contentId) || seconds > practiceMaximumSeconds) {
    return false
  }
  const enough = seconds >= practiceMinimumSeconds[kind]
  return kind === 'reading' ? enough : enough || (completed && seconds > 0)
}

export function readingCompleted(endSeenMs: number, markedRead: boolean): boolean {
  return markedRead || endSeenMs >= readingEndDwellMs
}

export function practiceMinutesOf(seconds: number): number {
  return Math.round(seconds / 60)
}

function mondayOf(day: string): string {
  const offset = (weekdayOf(day) + 6) % 7
  return new Date(Date.parse(`${day}T00:00:00Z`) - offset * 86_400_000).toISOString().slice(0, 10)
}

function secondsByDay(sessions: readonly PracticeSession[], timeZone: string): Map<string, number> {
  const totals = new Map<string, number>()
  for (const session of sessions) {
    const day = dayKey(new Date(session.startedAt), timeZone)
    totals.set(day, (totals.get(day) ?? 0) + session.seconds)
  }
  return totals
}

export function intensityOf(minutes: number): PracticeDay['level'] {
  const [light, some, more, most] = intensityMinutes
  if (minutes >= most) {
    return 4
  }
  if (minutes >= more) {
    return 3
  }
  if (minutes >= some) {
    return 2
  }
  return minutes >= light ? 1 : 0
}

export function practiceMap(
  sessions: readonly PracticeSession[],
  { now, timeZone, weeks }: { now: Date; timeZone: string; weeks: number },
): PracticeDay[] {
  const today = dayKey(now, timeZone)
  const lastMonday = mondayOf(today)
  const end = new Date(Date.parse(`${lastMonday}T00:00:00Z`) + 6 * 86_400_000)
    .toISOString()
    .slice(0, 10)
  const totals = secondsByDay(sessions, timeZone)
  return previousDays(end, weeks * 7).map((day) => {
    const seconds = totals.get(day)
    const minutes = practiceMinutesOf(seconds ?? 0)
    const practised = seconds !== undefined
    const level = practised && minutes < intensityMinutes[0] ? 1 : intensityOf(minutes)
    return { day, minutes, level, practised, future: day > today }
  })
}

export function practiceDays(map: readonly PracticeDay[]): number {
  return map.filter((day) => day.practised).length
}

function totalsSince(sessions: readonly PracticeSession[], from: string, timeZone: string) {
  const counted = sessions.filter(
    (session) => dayKey(new Date(session.startedAt), timeZone) >= from,
  )
  return {
    minutes: practiceMinutesOf(counted.reduce((total, session) => total + session.seconds, 0)),
    sessions: counted.length,
  }
}

export function practiceTotals(
  sessions: readonly PracticeSession[],
  { now, timeZone }: { now: Date; timeZone: string },
): { week: PracticeTotals; month: PracticeTotals } {
  const today = dayKey(now, timeZone)
  return {
    week: totalsSince(sessions, mondayOf(today), timeZone),
    month: totalsSince(sessions, `${today.slice(0, 7)}-01`, timeZone),
  }
}

export function topPractices(sessions: readonly PracticeSession[], limit: number): PracticeUse[] {
  const uses = new Map<string, PracticeUse>()
  for (const session of sessions) {
    const key = `${session.kind}:${session.contentId}`
    const use = uses.get(key) ?? {
      kind: session.kind,
      contentId: session.contentId,
      sessions: 0,
      minutes: 0,
    }
    uses.set(key, {
      ...use,
      sessions: use.sessions + 1,
      minutes: use.minutes + session.seconds / 60,
    })
  }
  return [...uses.values()]
    .map((use) => ({ ...use, minutes: Math.round(use.minutes) }))
    .sort((first, second) => second.sessions - first.sessions || second.minutes - first.minutes)
    .slice(0, limit)
}

export function practiceObservation(
  sessions: readonly PracticeSession[],
  checkIns: readonly DatedMood[],
  timeZone: string,
): PracticeObservation {
  const moods = levelsByDay(checkIns, timeZone)
  const differences = sessions.flatMap((session) => {
    const levels = moods.get(dayKey(new Date(session.startedAt), timeZone))
    return session.feelingAfter === null || levels === undefined
      ? []
      : [session.feelingAfter - meanOf(levels)]
  })
  if (differences.length < observationMinimumPairs) {
    return null
  }
  const mean = meanOf(differences)
  if (mean >= observationThreshold) {
    return 'better'
  }
  return Math.abs(mean) < observationThreshold ? 'same' : null
}
