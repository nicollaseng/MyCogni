export const instrumentIds = ['phq9', 'gad7'] as const

export type InstrumentId = (typeof instrumentIds)[number]

export type Severity = 'minimal' | 'mild' | 'moderate' | 'moderately_severe' | 'severe'

export interface SeverityBand {
  severity: Severity
  min: number
}

export interface Instrument {
  id: InstrumentId
  name: string
  prompt: string
  items: readonly string[]
  bands: readonly [SeverityBand, ...SeverityBand[]]
  riskItemIndex: number | null
}
