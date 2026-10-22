import {
  stepProgressListSchema,
  stepProgressSchema,
  zenSessionListSchema,
  zenSessionSchema,
  zenStatsSchema,
  type RecordZenSessionInput,
  type StepProgress,
  type ZenSession,
  type ZenStats,
  type ZenStepParams,
} from '@mycogni/contracts'
import { z } from 'zod'
import { ApiError, apiRequest } from './client'

function stepPath({ trackId, stepId }: ZenStepParams): `/v1/${string}` {
  return `/v1/zen/progress/${encodeURIComponent(trackId)}/${encodeURIComponent(stepId)}`
}

export function fetchStepProgress(): Promise<StepProgress[]> {
  return apiRequest({ path: '/v1/zen/progress', schema: stepProgressListSchema })
}

export function completeStep(step: ZenStepParams): Promise<StepProgress> {
  return apiRequest({ path: stepPath(step), schema: stepProgressSchema, method: 'PUT' })
}

export async function undoStep(step: ZenStepParams): Promise<void> {
  await apiRequest({ path: stepPath(step), schema: z.null(), method: 'DELETE' })
}

export function recordZenSession(input: RecordZenSessionInput): Promise<ZenSession> {
  return apiRequest({
    path: '/v1/zen/sessions',
    schema: zenSessionSchema,
    method: 'POST',
    body: input,
  })
}

export function fetchZenSessions(since: Date): Promise<ZenSession[]> {
  return apiRequest({
    path: `/v1/zen/sessions?since=${encodeURIComponent(since.toISOString())}`,
    schema: zenSessionListSchema,
  })
}

export async function rememberZenFeeling(id: string, feelingAfter: number): Promise<void> {
  await apiRequest({
    path: `/v1/zen/sessions/${encodeURIComponent(id)}`,
    schema: z.null(),
    method: 'PATCH',
    body: { feelingAfter },
  })
}

export async function fetchZenStats(): Promise<ZenStats | null> {
  try {
    return await apiRequest({ path: '/v1/admin/zen', schema: zenStatsSchema })
  } catch (error) {
    if (error instanceof ApiError && error.status === 403) {
      return null
    }
    throw error
  }
}
