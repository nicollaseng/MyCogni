import {
  memoryListSchema,
  memorySchema,
  type CreateMemoryInput,
  type Memory,
  type UpdateMemoryInput,
} from '@mycogni/contracts'
import { z } from 'zod'
import { apiRequest } from './client'

export function fetchMemories(): Promise<Memory[]> {
  return apiRequest({ path: '/v1/memories', schema: memoryListSchema })
}

export function createMemory(body: CreateMemoryInput): Promise<Memory> {
  return apiRequest({ path: '/v1/memories', schema: memorySchema, method: 'POST', body })
}

export function updateMemory(id: string, body: UpdateMemoryInput): Promise<Memory> {
  return apiRequest({ path: `/v1/memories/${id}`, schema: memorySchema, method: 'PATCH', body })
}

export async function deleteMemory(id: string): Promise<void> {
  await apiRequest({ path: `/v1/memories/${id}`, schema: z.null(), method: 'DELETE' })
}

export async function deleteAllMemories(): Promise<void> {
  await apiRequest({ path: '/v1/memories', schema: z.null(), method: 'DELETE' })
}
