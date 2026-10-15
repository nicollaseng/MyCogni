import type { z } from 'zod'

export type FieldName = 'email' | 'password' | 'code'

export interface FormState {
  error: string | null
  notice: string | null
  fieldErrors: Partial<Record<FieldName, string>>
}

export type FormAction = (state: FormState, formData: FormData) => Promise<FormState>

export const initialFormState: FormState = { error: null, notice: null, fieldErrors: {} }

const fieldNames: readonly FieldName[] = ['email', 'password', 'code']

function isFieldName(value: unknown): value is FieldName {
  return fieldNames.some((name) => name === value)
}

export function invalidFields(error: z.ZodError): FormState {
  const fieldErrors: Partial<Record<FieldName, string>> = {}
  for (const issue of error.issues) {
    const [field] = issue.path
    if (isFieldName(field) && fieldErrors[field] === undefined) {
      fieldErrors[field] = issue.message
    }
  }
  return { ...initialFormState, fieldErrors }
}

export function failed(error: string): FormState {
  return { ...initialFormState, error }
}

export function noticed(notice: string): FormState {
  return { ...initialFormState, notice }
}
