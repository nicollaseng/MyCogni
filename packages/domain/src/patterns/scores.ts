import type { Instrument, InstrumentId, Severity } from '../assessments/instrument.ts'
import { maxScoreOf } from '../assessments/scoring.ts'

export interface SeverityRange {
  severity: Severity
  min: number
  max: number
}

export interface DatedScore {
  instrument: InstrumentId
  totalScore: number
  completedAt: Date
}

export function severityRanges(instrument: Instrument): SeverityRange[] {
  return instrument.bands.map((band, index) => ({
    severity: band.severity,
    min: band.min,
    max: (instrument.bands[index + 1]?.min ?? maxScoreOf(instrument) + 1) - 1,
  }))
}

export function scoreTimeline<Score extends DatedScore>(
  scores: readonly Score[],
  instrument: InstrumentId,
): Score[] {
  return scores
    .filter((score) => score.instrument === instrument)
    .sort((first, second) => first.completedAt.getTime() - second.completedAt.getTime())
}
