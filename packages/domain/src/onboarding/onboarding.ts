import { screeningDomains, type InstrumentId } from '../assessments/instrument.ts'
import { domainOf } from '../assessments/scoring.ts'
import { missingConsents, type ConsentKind } from '../consents/consents.ts'

export interface OnboardingProgress {
  grantedConsents: readonly ConsentKind[]
  completedInstruments: readonly InstrumentId[]
}

export function isOnboardingReady({
  grantedConsents,
  completedInstruments,
}: OnboardingProgress): boolean {
  return (
    missingConsents(grantedConsents).length === 0 &&
    screeningDomains.every((domain) => completedInstruments.some((id) => domainOf(id) === domain))
  )
}
