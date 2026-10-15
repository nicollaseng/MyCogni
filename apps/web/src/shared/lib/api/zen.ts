import {
  stepProgressListSchema,
  stepProgressSchema,
  type StepProgress,
  type ZenStepParams,
} from '@mycogni/contracts'
import { z } from 'zod'
import { apiRequest } from './client'

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
