import {
  accountExportSchema,
  assessmentListSchema,
  assessmentSchema,
  checkInAddendumSchema,
  checkInCountSchema,
  checkInDetailSchema,
  checkInListSchema,
  checkInSchema,
  consentListSchema,
  patientInsightListSchema,
  profileSchema,
  type AccountExport,
  type Assessment,
  type CheckIn,
  type CheckInAddendum,
  type CheckInDetail,
  type Consent,
  type CreateCheckInAddendumInput,
  type CreateCheckInInput,
  type GrantConsentsInput,
  type PatientInsight,
  type Profile,
  type SubmitAssessmentInput,
  type UpdateProfileInput,
} from '@mycogni/contracts'
import type { ConsentKind } from '@mycogni/domain'
import { cache } from 'react'
import { z } from 'zod'
import { ApiError, apiRequest } from './client'

export interface CheckInFilter {
  since?: Date
  q?: string
  qTags?: readonly string[]
  tags?: readonly string[]
  minMood?: number
  maxMood?: number
  hasNote?: boolean
}

export interface CheckInPage extends CheckInFilter {
  before?: string
  limit?: number
}

const pageLimit = 200
const maxPages = 10

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

function checkInQuery({
  since,
  before,
  limit,
  q,
  qTags,
  tags,
  minMood,
  maxMood,
  hasNote,
}: CheckInPage): string {
  const query = new URLSearchParams()
  const entries: [string, string | undefined][] = [
    ['since', since?.toISOString()],
    ['before', before],
    ['limit', limit === undefined ? undefined : String(limit)],
    ['q', q === undefined || q === '' ? undefined : q],
    ['qTags', qTags === undefined || qTags.length === 0 ? undefined : qTags.join(',')],
    ['tags', tags === undefined || tags.length === 0 ? undefined : tags.join(',')],
    ['minMood', minMood === undefined ? undefined : String(minMood)],
    ['maxMood', maxMood === undefined ? undefined : String(maxMood)],
    ['hasNote', hasNote === undefined ? undefined : String(hasNote)],
  ]
  for (const [key, value] of entries) {
    if (value !== undefined) {
      query.set(key, value)
    }
  }
  return query.toString()
}

export function fetchCheckIns(page: CheckInPage): Promise<CheckIn[]> {
  return apiRequest({ path: `/v1/check-ins?${checkInQuery(page)}`, schema: checkInListSchema })
}

export async function countCheckIns(filter: CheckInFilter): Promise<number> {
  const { count } = await apiRequest({
    path: `/v1/check-ins/count?${checkInQuery(filter)}`,
    schema: checkInCountSchema,
  })
  return count
}

export async function fetchCheckInsSince(since: Date): Promise<CheckIn[]> {
  const collected: CheckIn[] = []
  let before: string | undefined
  for (let page = 0; page < maxPages; page++) {
    const batch = await fetchCheckIns({ since, before, limit: pageLimit })
    collected.push(...batch)
    before = batch.at(-1)?.recordedAt
    if (batch.length < pageLimit || before === undefined) {
      break
    }
  }
  return collected
}

export async function fetchCheckIn(id: string): Promise<CheckInDetail | null> {
  try {
    return await apiRequest({
      path: `/v1/check-ins/${encodeURIComponent(id)}`,
      schema: checkInDetailSchema,
    })
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return null
    }
    throw error
  }
}

export function appendToCheckIn(
  id: string,
  body: CreateCheckInAddendumInput,
): Promise<CheckInAddendum> {
  return apiRequest({
    path: `/v1/check-ins/${encodeURIComponent(id)}/addenda`,
    schema: checkInAddendumSchema,
    method: 'POST',
    body,
  })
}

export function fetchInsights(): Promise<PatientInsight[]> {
  return apiRequest({ path: '/v1/insights', schema: patientInsightListSchema })
}

export function fetchAccountExport(): Promise<AccountExport> {
  return apiRequest({ path: '/v1/me/export', schema: accountExportSchema })
}

export async function deleteAccount(): Promise<void> {
  await apiRequest({ path: '/v1/me', schema: z.null(), method: 'DELETE' })
}

export async function revokeConsent(kind: ConsentKind): Promise<void> {
  await apiRequest({ path: `/v1/consents/${kind}`, schema: z.null(), method: 'DELETE' })
}
