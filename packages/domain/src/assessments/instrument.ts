export const instrumentIds = ['phq9', 'gad7'] as const

export type InstrumentId = (typeof instrumentIds)[number]

export const severities = ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'] as const

export type Severity = (typeof severities)[number]

export interface SeverityBand {
  severity: Severity
  min: number
}

export interface Instrument {
  id: InstrumentId
  name: string
  itemCount: number
  bands: readonly [SeverityBand, ...SeverityBand[]]
  riskItemIndex: number | null
}
