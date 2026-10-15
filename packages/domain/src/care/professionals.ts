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
