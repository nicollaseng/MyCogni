import type { RegisterProfessionalInput } from '@mycogni/contracts'
import { requiresRegistration, type ConsentKind, type ProfessionalKind } from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'

export interface JoinValues {
  kind: ProfessionalKind | null
  fullName: string
  registration: string
  accepted: boolean
}

export type Join = (values: JoinValues) => Promise<ActionResult<null>>

export type JoinField = 'kind' | 'fullName' | 'registration' | 'consent'

export type JoinIssue =
  | 'kindRequired'
  | 'fullNameRequired'
  | 'fullNameTooLong'
  | 'registrationRequired'
  | 'registrationTooShort'
  | 'registrationTooLong'
  | 'consentRequired'

export type JoinIssues = Partial<Record<JoinField, JoinIssue>>

export const professionalConsentKinds: readonly ConsentKind[] = ['terms', 'privacy', 'adult']

const fullNameLimits = { min: 3, max: 120 }
const registrationLimits = { min: 3, max: 40 }

function fullNameIssue(fullName: string): JoinIssue | undefined {
  const length = fullName.trim().length
  if (length < fullNameLimits.min) {
    return 'fullNameRequired'
  }
  return length > fullNameLimits.max ? 'fullNameTooLong' : undefined
}

function registrationIssue(
  kind: ProfessionalKind | null,
  registration: string,
): JoinIssue | undefined {
  const length = registration.trim().length
  if (length === 0) {
    return kind !== null && requiresRegistration(kind) ? 'registrationRequired' : undefined
  }
  if (length < registrationLimits.min) {
    return 'registrationTooShort'
  }
  return length > registrationLimits.max ? 'registrationTooLong' : undefined
}

export function joinIssues(values: JoinValues): JoinIssues {
  const found: readonly [JoinField, JoinIssue | undefined][] = [
    ['kind', values.kind === null ? 'kindRequired' : undefined],
    ['fullName', fullNameIssue(values.fullName)],
    ['registration', registrationIssue(values.kind, values.registration)],
    ['consent', values.accepted ? undefined : 'consentRequired'],
  ]
  const issues: JoinIssues = {}
  for (const [field, issue] of found) {
    if (issue !== undefined) {
      issues[field] = issue
    }
  }
  return issues
}

export function registrationInput(
  kind: ProfessionalKind,
  values: JoinValues,
): RegisterProfessionalInput {
  const registration = values.registration.trim()
  return {
    kind,
    fullName: values.fullName.trim(),
    registration: registration === '' ? null : registration,
  }
}
