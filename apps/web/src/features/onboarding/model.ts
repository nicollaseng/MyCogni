import type { Assessment, Consent, Profile } from '@mycogni/contracts'
import { missingConsents, type ConsentKind, type InstrumentId } from '@mycogni/domain'

export type Step = 'consents' | 'name' | 'intro' | 'phq9' | 'support' | 'gad7' | 'results'

export type Phase = 'consents' | 'name' | 'screening' | 'results'

export const phases: readonly Phase[] = ['consents', 'name', 'screening', 'results']

export type Results = Partial<Record<InstrumentId, Assessment>>

export interface OnboardingStart {
  step: Step
  displayName: string
  results: Results
}

export type ActionResult<T> = { ok: true; value: T } | { ok: false; error: string }

export interface NameInput {
  displayName: string
  timezone: string
}

export interface ScreeningInput {
  instrument: InstrumentId
  answers: number[]
}

export interface OnboardingActions {
  acceptConsents: (kinds: ConsentKind[]) => Promise<ActionResult<null>>
  saveName: (input: NameInput) => Promise<ActionResult<null>>
  submitScreening: (input: ScreeningInput) => Promise<ActionResult<Assessment>>
  finishOnboarding: () => Promise<ActionResult<null>>
}

export function phaseOf(step: Step): Phase {
  if (step === 'consents' || step === 'name' || step === 'results') {
    return step
  }
  return 'screening'
}

function latestResults(assessments: readonly Assessment[]): Results {
  const results: Results = {}
  for (const assessment of assessments) {
    results[assessment.instrument] ??= assessment
  }
  return results
}

function firstStep(consents: readonly Consent[], results: Results): Step {
  if (missingConsents(consents.map((consent) => consent.kind)).length > 0) {
    return 'consents'
  }
  if (results.phq9 === undefined) {
    return 'name'
  }
  if (results.gad7 === undefined) {
    return 'gad7'
  }
  return 'results'
}

export function resumeFrom(
  profile: Profile,
  consents: readonly Consent[],
  assessments: readonly Assessment[],
): OnboardingStart {
  const results = latestResults(assessments)
  return {
    step: firstStep(consents, results),
    displayName: profile.displayName ?? '',
    results,
  }
}
