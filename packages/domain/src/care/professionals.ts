export const professionalKinds = [
  'psychologist',
  'psychiatrist',
  'physician',
  'psychoanalyst',
] as const

export type ProfessionalKind = (typeof professionalKinds)[number]

export const professionalStatuses = ['pending', 'verified', 'rejected'] as const

export type ProfessionalStatus = (typeof professionalStatuses)[number]

export function requiresRegistration(kind: ProfessionalKind): boolean {
  return kind !== 'psychoanalyst'
}

export const reviewDecisions = ['verified', 'rejected'] as const

export type ReviewDecision = (typeof reviewDecisions)[number]

export const reviewValidityMonths = 12

export function isReviewDue(verifiedAt: Date, now: Date): boolean {
  const due = new Date(verifiedAt)
  due.setUTCMonth(due.getUTCMonth() + reviewValidityMonths)
  return due.getTime() <= now.getTime()
}
