import { instrumentIds, type InstrumentId } from '../assessments/instrument.ts'
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
    instrumentIds.every((id) => completedInstruments.includes(id))
  )
}
