import type { ScreeningSummary } from '@mycogni/contracts'
import { latestPerDomain, type ScreeningDomain } from '@mycogni/domain'

export type LatestScreenings = Partial<Record<ScreeningDomain, ScreeningSummary>>

export const screeningColumns = {
  phq9: 'depression',
  gad7: 'anxiety',
} as const satisfies Readonly<Record<string, ScreeningDomain>>

export function latestScreenings(screenings: readonly ScreeningSummary[]): LatestScreenings {
  return { ...latestPerDomain(screenings) }
}
