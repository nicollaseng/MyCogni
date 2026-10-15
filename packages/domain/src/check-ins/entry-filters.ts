import { checkInLimits, maxMoodLevel } from './check-ins.ts'

export interface MoodRange {
  min: number
  max: number
}

export interface EntryFilterSelection {
  period: number | null
  mood: MoodRange | null
  emotions: readonly string[]
  contexts: readonly string[]
  withNote: boolean
}

export type FilterPart =
  | { kind: 'period'; days: number }
  | { kind: 'mood'; min: number; max: number }
  | { kind: 'emotion'; tag: string }
  | { kind: 'context'; tag: string }
  | { kind: 'note' }

const namedRanges: ReadonlyMap<string, MoodRange> = new Map([
  ['hard', { min: 0, max: 2 }],
  ['neutral', { min: 3, max: 3 }],
  ['good', { min: 4, max: 6 }],
])

const rangePattern = /^(\d)(?:-(\d))?$/

export function moodRangeOf(value: string | undefined): MoodRange | null {
  const named = namedRanges.get(value ?? '')
  if (named !== undefined) {
    return named
  }
  const match = rangePattern.exec(value ?? '')
  if (match === null) {
    return null
  }
  const min = Number(match[1])
  const max = match[2] === undefined ? min : Number(match[2])
  return min <= max && max <= maxMoodLevel ? { min, max } : null
}

export function moodRangeParam({ min, max }: MoodRange): string {
  return min === max ? String(min) : `${String(min)}-${String(max)}`
}

export function toggleMoodLevel(range: MoodRange | null, level: number): MoodRange | null {
  if (range === null) {
    return { min: level, max: level }
  }
  if (level < range.min) {
    return { min: level, max: range.max }
  }
  if (level > range.max) {
    return { min: range.min, max: level }
  }
  if (range.min === range.max) {
    return null
  }
  if (level === range.min) {
    return { min: level + 1, max: range.max }
  }
  if (level === range.max) {
    return { min: range.min, max: level - 1 }
  }
  return { min: level, max: level }
}

export function tagListOf(value: string | undefined, limit: number = checkInLimits.tags): string[] {
  const tags = (value ?? '')
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag !== '' && tag.length <= checkInLimits.tagLength)
  return [...new Set(tags)].slice(0, limit)
}

export function filterParts({
  period,
  mood,
  emotions,
  contexts,
  withNote,
}: EntryFilterSelection): FilterPart[] {
  return [
    ...(period === null ? [] : [{ kind: 'period', days: period } as const]),
    ...(mood === null ? [] : [{ kind: 'mood', min: mood.min, max: mood.max } as const]),
    ...emotions.map((tag) => ({ kind: 'emotion', tag }) as const),
    ...contexts.map((tag) => ({ kind: 'context', tag }) as const),
    ...(withNote ? [{ kind: 'note' } as const] : []),
  ]
}

export function activeFilterCount(selection: EntryFilterSelection): number {
  return filterParts(selection).length
}
