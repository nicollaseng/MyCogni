import type { Assessment } from '@mycogni/contracts'
import type { InstrumentId } from '@mycogni/domain'

export type LatestResults = Partial<Record<InstrumentId, Assessment>>

export function latestByInstrument(assessments: readonly Assessment[]): LatestResults {
  const results: LatestResults = {}
  for (const assessment of assessments) {
    results[assessment.instrument] ??= assessment
  }
  return results
}
