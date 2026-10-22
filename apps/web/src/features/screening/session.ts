import type { Assessment } from '@mycogni/contracts'
import {
  emptyAnswers,
  screeningDomains,
  type InstrumentId,
  type ScreeningDomain,
  type ScreeningSession,
} from '@mycogni/domain'
import type { ScreeningDraft } from './draft'
import { latestByDomain, type LatestResults } from './latest'

export type SessionScope = 'onboarding' | 'retake'

export interface StartedSession {
  session: ScreeningSession
  saved: LatestResults
}

function savedInDraft(
  assessments: readonly Assessment[],
  draft: ScreeningDraft | null,
): LatestResults {
  const saved: LatestResults = {}
  for (const domain of screeningDomains) {
    const found = assessments.find((assessment) => assessment.id === draft?.saved[domain])
    if (found !== undefined) {
      saved[domain] = found
    }
  }
  return saved
}

function instrumentsOf(saved: LatestResults): Partial<Record<ScreeningDomain, InstrumentId>> {
  const instruments: Partial<Record<ScreeningDomain, InstrumentId>> = {}
  for (const domain of screeningDomains) {
    const result = saved[domain]
    if (result !== undefined) {
      instruments[domain] = result.instrument
    }
  }
  return instruments
}

export function startedSession(
  scope: SessionScope,
  assessments: readonly Assessment[],
  draft: ScreeningDraft | null,
): StartedSession {
  const saved =
    scope === 'onboarding' ? latestByDomain(assessments) : savedInDraft(assessments, draft)
  return {
    session: { answers: draft?.answers ?? emptyAnswers, saved: instrumentsOf(saved) },
    saved,
  }
}

export function resultsBefore(
  assessments: readonly Assessment[],
  saved: LatestResults,
): LatestResults {
  const ids = new Set(screeningDomains.map((domain) => saved[domain]?.id))
  return latestByDomain(assessments.filter((assessment) => !ids.has(assessment.id)))
}
