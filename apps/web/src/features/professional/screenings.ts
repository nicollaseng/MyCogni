import type { ScreeningSummary } from '@mycogni/contracts'
import type { InstrumentId } from '@mycogni/domain'

export type LatestScreenings = Partial<Record<InstrumentId, ScreeningSummary>>

export function latestScreenings(screenings: readonly ScreeningSummary[]): LatestScreenings {
  const latest: LatestScreenings = {}
  for (const screening of screenings) {
    const current = latest[screening.instrument]
    if (current === undefined || screening.completedAt > current.completedAt) {
      latest[screening.instrument] = screening
    }
  }
  return latest
}

export function needsAttention(screenings: readonly ScreeningSummary[]): boolean {
  return latestScreenings(screenings).phq9?.hasRiskFlag === true
}
