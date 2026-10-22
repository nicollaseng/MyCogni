import type { RegisterProfessionalInput } from '@mycogni/contracts'
import {
  councilOf,
  institutionRegistrationLimits,
  parseRegistration,
  registrationIssues,
  type ConsentKind,
  type ProfessionalKind,
} from '@mycogni/domain'
import type { ActionResult } from '@/shared/lib/actions/result'

export interface JoinValues {
  kind: ProfessionalKind | null
  fullName: string
  uf: string
  number: string
  institutionRegistration: string
  accepted: boolean
}

export type Join = (values: JoinValues) => Promise<ActionResult<null>>

export type JoinField = 'kind' | 'fullName' | 'uf' | 'number' | 'institution' | 'consent'

export type JoinIssue =
  | 'kindRequired'
  | 'fullNameRequired'
  | 'fullNameTooLong'
  | 'ufRequired'
  | 'numberRequired'
  | 'numberInvalid'
  | 'institutionTooShort'
  | 'institutionTooLong'
  | 'consentRequired'

export type JoinIssues = Partial<Record<JoinField, JoinIssue>>

export const professionalConsentKinds: readonly ConsentKind[] = ['terms', 'privacy', 'adult']

export const emptyJoinValues: JoinValues = {
  kind: null,
  fullName: '',
  uf: '',
  number: '',
  institutionRegistration: '',
  accepted: false,
}

const fullNameLimits = { min: 3, max: 120 }

function fullNameIssue(fullName: string): JoinIssue | undefined {
  const length = fullName.trim().length
  if (length < fullNameLimits.min) {
    return 'fullNameRequired'
  }
  return length > fullNameLimits.max ? 'fullNameTooLong' : undefined
}

function councilIssues({ kind, uf, number }: JoinValues): JoinIssues {
  const issues: JoinIssues = {}
  for (const issue of kind === null ? [] : registrationIssues(kind, { uf, number })) {
    issues[issue === 'ufRequired' ? 'uf' : 'number'] = issue
  }
  return issues
}

function institutionIssue({ kind, institutionRegistration }: JoinValues): JoinIssue | undefined {
  const length = institutionRegistration.trim().length
  if (kind === null || councilOf(kind) !== null || length === 0) {
    return undefined
  }
  if (length < institutionRegistrationLimits.min) {
    return 'institutionTooShort'
  }
  return length > institutionRegistrationLimits.max ? 'institutionTooLong' : undefined
}

export function joinIssues(values: JoinValues): JoinIssues {
  const found: readonly [JoinField, JoinIssue | undefined][] = [
    ['kind', values.kind === null ? 'kindRequired' : undefined],
    ['fullName', fullNameIssue(values.fullName)],
    ['institution', institutionIssue(values)],
    ['consent', values.accepted ? undefined : 'consentRequired'],
  ]
  const issues: JoinIssues = councilIssues(values)
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
  const parsed = parseRegistration(kind, { uf: values.uf, number: values.number })
  const institution = values.institutionRegistration.trim()
  return {
    kind,
    fullName: values.fullName.trim(),
    registration:
      parsed.ok && parsed.registration !== null
        ? { uf: parsed.registration.uf, number: parsed.registration.number }
        : null,
    institutionRegistration: councilOf(kind) === null && institution !== '' ? institution : null,
  }
}
