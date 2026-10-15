import {
  assessmentListSchema,
  assessmentSchema,
  consentListSchema,
  profileSchema,
  type Assessment,
  type Consent,
  type GrantConsentsInput,
  type Profile,
  type SubmitAssessmentInput,
  type UpdateProfileInput,
} from '@mycogni/contracts'
import { apiRequest } from './client'

export function fetchProfile(): Promise<Profile> {
  return apiRequest({ path: '/v1/me', schema: profileSchema })
}

export function updateProfile(body: UpdateProfileInput): Promise<Profile> {
  return apiRequest({ path: '/v1/me', schema: profileSchema, method: 'PATCH', body })
}

export function fetchConsents(): Promise<Consent[]> {
  return apiRequest({ path: '/v1/consents', schema: consentListSchema })
}

export function grantConsents(body: GrantConsentsInput): Promise<Consent[]> {
  return apiRequest({ path: '/v1/consents', schema: consentListSchema, method: 'POST', body })
}

export function fetchAssessments(): Promise<Assessment[]> {
  return apiRequest({ path: '/v1/assessments', schema: assessmentListSchema })
}

export function submitAssessment(body: SubmitAssessmentInput): Promise<Assessment> {
  return apiRequest({ path: '/v1/assessments', schema: assessmentSchema, method: 'POST', body })
}

export function completeOnboarding(): Promise<Profile> {
  return apiRequest({ path: '/v1/onboarding/complete', schema: profileSchema, method: 'POST' })
}
