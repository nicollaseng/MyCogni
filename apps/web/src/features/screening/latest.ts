import type { Assessment } from '@mycogni/contracts'
import {
  instrumentIds,
  plainLevelOf,
  plainTrendOf,
  type InstrumentId,
  type PlainLevel,
  type PlainTrend,
} from '@mycogni/domain'

export type LatestResults = Partial<Record<InstrumentId, Assessment>>

export interface PlainResult {
  assessment: Assessment
  level: PlainLevel
  trend: PlainTrend | null
}

export function latestByInstrument(assessments: readonly Assessment[]): LatestResults {
  const results: LatestResults = {}
  for (const assessment of newestFirst(assessments)) {
    results[assessment.instrument] ??= assessment
  }
  return results
}

function newestFirst(assessments: readonly Assessment[]): Assessment[] {
  return [...assessments].sort((first, second) =>
    second.completedAt.localeCompare(first.completedAt),
  )
}

export function plainResultOf(
  assessment: Assessment,
  previous: Assessment | undefined,
): PlainResult {
  return {
    assessment,
    level: plainLevelOf(assessment.severity),
    trend: previous === undefined ? null : plainTrendOf(assessment.severity, previous.severity),
  }
}

export function latestPlainResults(
  assessments: readonly Assessment[],
): Partial<Record<InstrumentId, PlainResult>> {
  const results: Partial<Record<InstrumentId, PlainResult>> = {}
  for (const id of instrumentIds) {
    const [latest, previous] = newestFirst(assessments).filter(
      (assessment) => assessment.instrument === id,
    )
    if (latest !== undefined) {
      results[id] = plainResultOf(latest, previous)
    }
  }
  return results
}
