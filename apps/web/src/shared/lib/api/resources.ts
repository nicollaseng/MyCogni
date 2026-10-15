import {
  accountExportSchema,
  assessmentListSchema,
  assessmentSchema,
  checkInListSchema,
  checkInSchema,
  consentListSchema,
  profileSchema,
  type AccountExport,
  type Assessment,
  type CheckIn,
  type Consent,
  type CreateCheckInInput,
  type GrantConsentsInput,
  type Profile,
  type SubmitAssessmentInput,
  type UpdateProfileInput,
} from '@mycogni/contracts'
import { cache } from 'react'
import { z } from 'zod'
import { apiRequest } from './client'

export interface CheckInFilter {
  since?: Date
  before?: string
  limit?: number
}

export const fetchProfile = cache((): Promise<Profile> =>
  apiRequest({ path: '/v1/me', schema: profileSchema }),
)

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

export function createCheckIn(body: CreateCheckInInput): Promise<CheckIn> {
  return apiRequest({ path: '/v1/check-ins', schema: checkInSchema, method: 'POST', body })
}

export function fetchCheckIns({ since, before, limit }: CheckInFilter): Promise<CheckIn[]> {
  const query = new URLSearchParams()
  if (since !== undefined) {
    query.set('since', since.toISOString())
  }
  if (before !== undefined) {
    query.set('before', before)
  }
  if (limit !== undefined) {
    query.set('limit', String(limit))
  }
  return apiRequest({ path: `/v1/check-ins?${query.toString()}`, schema: checkInListSchema })
}

export function fetchAccountExport(): Promise<AccountExport> {
  return apiRequest({ path: '/v1/me/export', schema: accountExportSchema })
}

export async function deleteAccount(): Promise<void> {
  await apiRequest({ path: '/v1/me', schema: z.null(), method: 'DELETE' })
}
