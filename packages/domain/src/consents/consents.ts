export const consentKinds = [
  'terms',
  'privacy',
  'health_data',
  'ai_processing',
  'adult',
  'assistant_data',
  'assistant_journal',
] as const

export type ConsentKind = (typeof consentKinds)[number]

export const requiredConsentKinds: readonly ConsentKind[] = [
  'terms',
  'privacy',
  'health_data',
  'adult',
]

export const patientConsentKinds: readonly ConsentKind[] = [
  'health_data',
  'ai_processing',
  'assistant_data',
  'assistant_journal',
]

export const consentVersion = '2026-10'

export const legalConsentKinds: readonly ConsentKind[] = ['terms', 'privacy']

export const legalVersion = '2026-10-22'

export function consentVersionOf(kind: ConsentKind): string {
  return legalConsentKinds.includes(kind) ? legalVersion : consentVersion
}

export function isCurrentConsent({
  kind,
  version,
}: {
  kind: ConsentKind
  version: string
}): boolean {
  return consentVersionOf(kind) === version
}

export function missingConsents(granted: readonly ConsentKind[]): ConsentKind[] {
  return requiredConsentKinds.filter((kind) => !granted.includes(kind))
}

export function isRevocable(kind: ConsentKind): boolean {
  return !requiredConsentKinds.includes(kind)
}

export function isPatientConsent(kind: ConsentKind): boolean {
  return patientConsentKinds.includes(kind)
}
