import type { ProfessionalKind } from './professionals.ts'

export const brazilianStates = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const

export type BrazilianState = (typeof brazilianStates)[number]

export const professionalCouncils = ['crp', 'crm'] as const

export type ProfessionalCouncil = (typeof professionalCouncils)[number]

export const registrationNumberLimits = { min: 4, max: 8 } as const

export const institutionRegistrationLimits = { min: 3, max: 40 } as const

export const registrationNumberPattern = /^[0-9]{4,8}$/

const crpRegions: Readonly<Record<BrazilianState, string>> = {
  AC: '24',
  AL: '15',
  AP: '10',
  AM: '20',
  BA: '03',
  CE: '11',
  DF: '01',
  ES: '16',
  GO: '09',
  MA: '22',
  MT: '18',
  MS: '14',
  MG: '04',
  PA: '10',
  PB: '13',
  PR: '08',
  PE: '02',
  PI: '21',
  RJ: '05',
  RN: '17',
  RS: '07',
  RO: '24',
  RR: '20',
  SC: '12',
  SP: '06',
  SE: '19',
  TO: '23',
}

const councils: Readonly<Record<ProfessionalKind, ProfessionalCouncil | null>> = {
  psychologist: 'crp',
  psychiatrist: 'crm',
  physician: 'crm',
  psychoanalyst: null,
}

export interface CouncilRegistration {
  council: ProfessionalCouncil
  uf: BrazilianState
  number: string
}

export interface StoredRegistration {
  council: ProfessionalCouncil | null
  uf: string | null
  number: string | null
  text: string | null
}

export interface RegistrationInput {
  uf: string
  number: string
}

export type RegistrationIssue = 'ufRequired' | 'numberRequired' | 'numberInvalid'

export type RegistrationParse =
  { ok: true; registration: CouncilRegistration | null } | { ok: false; issue: RegistrationIssue }

export function councilOf(kind: ProfessionalKind): ProfessionalCouncil | null {
  return councils[kind]
}

export function isBrazilianState(value: string): value is BrazilianState {
  return brazilianStates.some((state) => state === value)
}

export function crpRegionOf(uf: BrazilianState): string {
  return crpRegions[uf]
}

export function isRegistrationNumber(value: string): boolean {
  return registrationNumberPattern.test(value)
}

export function registrationDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, registrationNumberLimits.max)
}

export function formatRegistration({ council, uf, number }: CouncilRegistration): string {
  return council === 'crp' ? `CRP ${crpRegionOf(uf)}/${number}` : `CRM-${uf} ${number}`
}

export function parseRegistration(
  kind: ProfessionalKind,
  { uf, number }: RegistrationInput,
): RegistrationParse {
  const council = councilOf(kind)
  if (council === null) {
    return { ok: true, registration: null }
  }
  if (!isBrazilianState(uf)) {
    return { ok: false, issue: 'ufRequired' }
  }
  const digits = number.trim()
  if (digits === '') {
    return { ok: false, issue: 'numberRequired' }
  }
  if (!isRegistrationNumber(digits)) {
    return { ok: false, issue: 'numberInvalid' }
  }
  return { ok: true, registration: { council, uf, number: digits } }
}

export function storedCouncilRegistration({
  council,
  uf,
  number,
}: StoredRegistration): CouncilRegistration | null {
  if (council === null || uf === null || number === null) {
    return null
  }
  return isBrazilianState(uf) && isRegistrationNumber(number) ? { council, uf, number } : null
}

export function registrationLabel(stored: StoredRegistration): string | null {
  const registration = storedCouncilRegistration(stored)
  if (registration !== null) {
    return formatRegistration(registration)
  }
  const text = stored.text?.trim() ?? ''
  return text === '' ? null : text
}

export function needsRegistrationReview(
  kind: ProfessionalKind,
  stored: StoredRegistration,
): boolean {
  const council = councilOf(kind)
  return council !== null && storedCouncilRegistration(stored)?.council !== council
}
