export const instrumentIds = ['phq9', 'gad7', 'phq2', 'gad2'] as const

export type InstrumentId = (typeof instrumentIds)[number]

export const screeningDomains = ['depression', 'anxiety'] as const

export type ScreeningDomain = (typeof screeningDomains)[number]

export const severities = ['minimal', 'mild', 'moderate', 'moderately_severe', 'severe'] as const

export type Severity = (typeof severities)[number]

export interface SeverityBand {
  severity: Severity
  min: number
}

export interface Instrument {
  id: InstrumentId
  name: string
  domain: ScreeningDomain
  items: readonly number[]
  itemCount: number
  scoredItems: number
  bands: readonly [SeverityBand, ...SeverityBand[]]
  riskItemIndex: number | null
}
