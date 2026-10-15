import { maxMoodLevel, moodNames, type MoodName } from '@mycogni/domain'

export const moodKeys = moodNames

export type MoodKey = MoodName

export type MoodLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export { maxMoodLevel }

export const neutralMood: MoodLevel = 3

export function isMoodLevel(value: number): value is MoodLevel {
  return Number.isInteger(value) && value >= 0 && value <= maxMoodLevel
}

export function valenceOf(level: MoodLevel): number {
  return level / maxMoodLevel
}

export function moodKeyOf(level: MoodLevel): MoodKey {
  return moodKeys[level]
}

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value))
}

export function moodColor(valence: number): string {
  const value = clamp(valence)
  if (value <= 0.5) {
    const low = Math.round((1 - value / 0.5) * 100)
    return `color-mix(in oklab, var(--mood-low) ${String(low)}%, var(--mood-mid))`
  }
  const high = Math.round(((value - 0.5) / 0.5) * 100)
  return `color-mix(in oklab, var(--mood-high) ${String(high)}%, var(--mood-mid))`
}

export function nearestMoodKey(average: number): MoodKey {
  return moodKeys[Math.min(maxMoodLevel, Math.max(0, Math.round(average)))] ?? 'neutral'
}
