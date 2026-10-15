import type { Assessment, Consent, Profile } from '@mycogni/contracts'
import { missingConsents, type ConsentKind } from '@mycogni/domain'
import { latestByInstrument, type LatestResults } from '@/features/screening/latest'
import type { SubmitScreening } from '@/features/screening/model'
import type { ActionResult } from '@/shared/lib/actions/result'

export type Step = 'consents' | 'name' | 'intro' | 'phq9' | 'support' | 'gad7' | 'results'

export type Phase = 'consents' | 'name' | 'screening' | 'results'

export const phases: readonly Phase[] = ['consents', 'name', 'screening', 'results']

export type Results = LatestResults

export interface OnboardingStart {
  step: Step
  displayName: string
  results: Results
}

export interface NameInput {
  displayName: string
  timezone: string
}

export interface OnboardingActions {
  acceptConsents: (kinds: ConsentKind[]) => Promise<ActionResult<null>>
  saveName: (input: NameInput) => Promise<ActionResult<null>>
  submitScreening: SubmitScreening
  finishOnboarding: () => Promise<ActionResult<null>>
}

export function phaseOf(step: Step): Phase {
  if (step === 'consents' || step === 'name' || step === 'results') {
    return step
  }
  return 'screening'
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
  const results = latestByInstrument(assessments)
  return {
    step: firstStep(consents, results),
    displayName: profile.displayName ?? '',
    results,
  }
}
