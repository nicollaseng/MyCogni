import {
  assistantConversationSchema,
  assistantExchangeSchema,
  assistantOverviewSchema,
  transcriptionSchema,
  type AssistantConversation,
  type AssistantExchange,
  type AssistantOverview,
  type SendPersonalAssistantMessageInput,
  type Transcription,
} from '@mycogni/contracts'
import type { Locale } from '@mycogni/domain'
import { z } from 'zod'
import { apiRequest, apiUpload } from './client'

export type AssistantTarget =
  { mode: 'personal'; entryId?: string } | { mode: 'professional'; patientId: string }

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
  body: SendPersonalAssistantMessageInput,
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

export function transcribeVoice(
  audio: ArrayBuffer,
  contentType: string,
  locale: Locale,
): Promise<Transcription> {
  return apiUpload({
    path: `/v1/assistant/transcriptions?locale=${encodeURIComponent(locale)}`,
    schema: transcriptionSchema,
    body: audio,
    contentType,
  })
}
