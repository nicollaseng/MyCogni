import { checkInSearchLength } from '@mycogni/contracts'
import { checkInLimits } from '@mycogni/domain'
import type { CheckInFilter } from '@/shared/lib/api/resources'

export const periods = ['7', '30', '90'] as const

export type Period = (typeof periods)[number]

export const moodRanges = {
  hard: { min: 0, max: 2 },
  neutral: { min: 3, max: 3 },
  good: { min: 4, max: 6 },
} as const

export type MoodRange = keyof typeof moodRanges

export const moodRangeIds: readonly MoodRange[] = ['hard', 'neutral', 'good']

export interface EntryFilters {
  q: string
  period: Period | null
  mood: MoodRange | null
  emotion: string | null
  context: string | null
  withNote: boolean
}

export type SearchParams = Partial<Record<string, string | string[] | undefined>>

export type EntriesHref = '/entries' | `/entries?${string}`

export const noFilters: EntryFilters = {
  q: '',
  period: null,
  mood: null,
  emotion: null,
  context: null,
  withNote: false,
}

const dayInMs = 24 * 60 * 60 * 1000

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function isPeriod(value: string | undefined): value is Period {
  return periods.some((period) => period === value)
}

export function isMoodRange(value: string | undefined): value is MoodRange {
  return moodRangeIds.some((range) => range === value)
}

function tagOf(value: string | undefined): string | null {
  const tag = value?.trim() ?? ''
  return tag === '' || tag.length > checkInLimits.tagLength || tag.includes(',') ? null : tag
}

export function parseEntryFilters(params: SearchParams): EntryFilters {
  const period = firstParam(params.period)
  const mood = firstParam(params.mood)
  return {
    q: (firstParam(params.q) ?? '').trim().slice(0, checkInSearchLength),
    period: isPeriod(period) ? period : null,
    mood: isMoodRange(mood) ? mood : null,
    emotion: tagOf(firstParam(params.emotion)),
    context: tagOf(firstParam(params.context)),
    withNote: firstParam(params.note) === '1',
  }
}

export function isFiltered(filters: EntryFilters): boolean {
  return (
    filters.q !== '' ||
    filters.period !== null ||
    filters.mood !== null ||
    filters.emotion !== null ||
    filters.context !== null ||
    filters.withNote
  )
}

export function entryQuery(filters: EntryFilters, before?: string): Record<string, string> {
  const entries: [string, string | null][] = [
    ['q', filters.q === '' ? null : filters.q],
    ['period', filters.period],
    ['mood', filters.mood],
    ['emotion', filters.emotion],
    ['context', filters.context],
    ['note', filters.withNote ? '1' : null],
    ['before', before ?? null],
  ]
  return Object.fromEntries(
    entries.flatMap(([key, value]) => (value === null ? [] : [[key, value]])),
  )
}

export function entriesHref(filters: EntryFilters): EntriesHref {
  const query = new URLSearchParams(entryQuery(filters)).toString()
  return query === '' ? '/entries' : `/entries?${query}`
}

export function checkInFilterOf(
  filters: EntryFilters,
  { now, qTags }: { now: Date; qTags: readonly string[] },
): CheckInFilter {
  const range = filters.mood === null ? undefined : moodRanges[filters.mood]
  return {
    since:
      filters.period === null
        ? undefined
        : new Date(now.getTime() - Number(filters.period) * dayInMs),
    q: filters.q === '' ? undefined : filters.q,
    qTags: filters.q === '' ? undefined : qTags,
    tags: [filters.emotion, filters.context].filter((tag) => tag !== null),
    minMood: range?.min,
    maxMood: range?.max,
    hasNote: filters.withNote ? true : undefined,
  }
}
