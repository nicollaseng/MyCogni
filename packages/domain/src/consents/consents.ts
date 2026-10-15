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

export const consentVersion = '2026-10'

export function missingConsents(granted: readonly ConsentKind[]): ConsentKind[] {
  return requiredConsentKinds.filter((kind) => !granted.includes(kind))
}

export function isRevocable(kind: ConsentKind): boolean {
  return !requiredConsentKinds.includes(kind)
}
