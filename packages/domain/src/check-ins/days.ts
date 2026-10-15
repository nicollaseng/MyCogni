export interface DatedMood {
  moodLevel: number
  recordedAt: Date
}

const dayInUtc = 24 * 60 * 60 * 1000

export function dayKey(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function previousDays(today: string, count: number): string[] {
  const end = Date.parse(`${today}T00:00:00Z`)
  return Array.from({ length: count }, (_, index) =>
    new Date(end - (count - 1 - index) * dayInUtc).toISOString().slice(0, 10),
  )
}

export function dailyMoods(
  moods: readonly DatedMood[],
  { timeZone, today, days }: { timeZone: string; today: Date; days: number },
): (number | null)[] {
  const levelsByDay = new Map<string, number[]>()
  for (const mood of moods) {
    const key = dayKey(mood.recordedAt, timeZone)
    levelsByDay.set(key, [...(levelsByDay.get(key) ?? []), mood.moodLevel])
  }
  return previousDays(dayKey(today, timeZone), days).map((key) => {
    const levels = levelsByDay.get(key)
    if (levels === undefined) {
      return null
    }
    return Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length)
  })
}
