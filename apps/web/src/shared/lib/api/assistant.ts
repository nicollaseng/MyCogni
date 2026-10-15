import {
  assistantConversationSchema,
  assistantExchangeSchema,
  assistantOverviewSchema,
  type AssistantConversation,
  type AssistantExchange,
  type AssistantOverview,
  type SendAssistantMessageInput,
} from '@mycogni/contracts'
import { z } from 'zod'
import { apiRequest } from './client'

export type AssistantTarget = { mode: 'personal' } | { mode: 'professional'; patientId: string }

function basePath(target: AssistantTarget): `/v1/${string}` {
  return target.mode === 'personal'
    ? '/v1/assistant'
    : `/v1/professional/patients/${encodeURIComponent(target.patientId)}/assistant`
}

export function fetchAssistant(target: AssistantTarget): Promise<AssistantOverview> {
  return apiRequest({ path: basePath(target), schema: assistantOverviewSchema })
}

export function sendAssistantMessage(
  target: AssistantTarget,
  body: SendAssistantMessageInput,
): Promise<AssistantExchange> {
  return apiRequest({
    path: `${basePath(target)}/messages`,
    schema: assistantExchangeSchema,
    method: 'POST',
    body,
  })
}

export function fetchAssistantConversation(id: string): Promise<AssistantConversation> {
  return apiRequest({
    path: `/v1/assistant/conversations/${encodeURIComponent(id)}`,
    schema: assistantConversationSchema,
  })
}

export async function deleteAssistantConversation(id: string): Promise<void> {
  await apiRequest({
    path: `/v1/assistant/conversations/${encodeURIComponent(id)}`,
    schema: z.null(),
    method: 'DELETE',
  })
}
