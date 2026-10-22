import type { Assessment } from '@mycogni/contracts'
import {
  latestPerDomain,
  plainLevelOf,
  plainTrendOf,
  screeningDomains,
  type PlainLevel,
  type PlainTrend,
  type ScreeningDomain,
} from '@mycogni/domain'

export type LatestResults = Partial<Record<ScreeningDomain, Assessment>>

export interface PlainResult {
  domain: ScreeningDomain
  assessment: Assessment
  level: PlainLevel
  trend: PlainTrend | null
}

export function latestByDomain(assessments: readonly Assessment[]): LatestResults {
  return { ...latestPerDomain(assessments) }
}

export function plainResultOf(
  domain: ScreeningDomain,
  assessment: Assessment,
  previous: Assessment | undefined,
): PlainResult {
  return {
    domain,
    assessment,
    level: plainLevelOf(assessment.severity),
    trend: previous === undefined ? null : plainTrendOf(assessment.severity, previous.severity),
  }
}

export function latestPlainResults(
  assessments: readonly Assessment[],
): Partial<Record<ScreeningDomain, PlainResult>> {
  const latest = latestPerDomain(assessments)
  const results: Partial<Record<ScreeningDomain, PlainResult>> = {}
  for (const domain of screeningDomains) {
    const current = latest[domain]
    if (current !== undefined) {
      const previous = latestPerDomain(assessments.filter((item) => item.id !== current.id))[domain]
      results[domain] = plainResultOf(domain, current, previous)
    }
  }
  return results
}
