import type { InstrumentId, Severity } from './instrument.ts'

export const plainLevels = ['low', 'mild', 'moderate', 'high'] as const

export type PlainLevel = (typeof plainLevels)[number]

export const plainTrends = ['same', 'better', 'higher'] as const

export type PlainTrend = (typeof plainTrends)[number]

export const plainTopics = { phq9: 'mood', gad7: 'anxiety' } as const satisfies Readonly<
  Record<InstrumentId, string>
>

export type PlainTopic = (typeof plainTopics)[InstrumentId]

const levelOfSeverity: Readonly<Record<Severity, PlainLevel>> = {
  minimal: 'low',
  mild: 'mild',
  moderate: 'moderate',
  moderately_severe: 'high',
  severe: 'high',
}

export function plainLevelOf(severity: Severity): PlainLevel {
  return levelOfSeverity[severity]
}

export function plainLevelRank(level: PlainLevel): number {
  return plainLevels.indexOf(level)
}

export function plainTrendOf(current: Severity, previous: Severity): PlainTrend {
  const change = plainLevelRank(plainLevelOf(current)) - plainLevelRank(plainLevelOf(previous))
  if (change === 0) {
    return 'same'
  }
  return change < 0 ? 'better' : 'higher'
}
