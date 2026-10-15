'use server'

import type { AssistantConversation, AssistantExchange } from '@mycogni/contracts'
import { assistantLimits } from '@mycogni/domain'
import { getLocale, getTranslations } from 'next-intl/server'
import { z } from 'zod'
import { attempt, failure, type ActionResult } from '@/shared/lib/actions/result'
import {
  deleteAssistantConversation,
  fetchAssistant,
  fetchAssistantConversation,
  sendAssistantMessage,
  type AssistantTarget,
} from '@/shared/lib/api/assistant'
import { fetchCareLinks } from '@/shared/lib/api/care'
import { ApiError } from '@/shared/lib/api/client'
import { grantConsents } from '@/shared/lib/api/resources'
import type { AssistantState } from './model'

const targetSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('personal') }),
  z.object({ mode: z.literal('professional'), patientId: z.uuid() }),
])

const idSchema = z.uuid()

const textSchema = z.string().trim().min(1).max(assistantLimits.messageLength)

export async function openAssistant(
  target: AssistantTarget,
): Promise<ActionResult<AssistantState>> {
  const t = await getTranslations('assistant.errors')
  const parsed = targetSchema.safeParse(target)
  if (!parsed.success) {
    return failure(t('load'))
  }
  return attempt(async () => {
    const [overview, links] = await Promise.all([
      fetchAssistant(parsed.data),
      parsed.data.mode === 'personal' ? fetchCareLinks() : Promise.resolve([]),
    ])
    return {
      overview,
      contacts: links.map((link) => ({
        name: link.professional.name,
        kind: link.professional.kind,
      })),
    }
  }, t('load'))
}

export async function openConversation(id: string): Promise<ActionResult<AssistantConversation>> {
  const t = await getTranslations('assistant.errors')
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) {
    return failure(t('load'))
  }
  return attempt(() => fetchAssistantConversation(parsed.data), t('load'))
}

export async function askAssistant(
  target: AssistantTarget,
  conversationId: string | null,
  text: string,
): Promise<ActionResult<AssistantExchange>> {
  const t = await getTranslations('assistant.errors')
  const parsedTarget = targetSchema.safeParse(target)
  const parsedId = idSchema.nullable().safeParse(conversationId)
  const parsedText = textSchema.safeParse(text)
  if (!parsedTarget.success || !parsedId.success || !parsedText.success) {
    return failure(t('failed'))
  }
  try {
    return {
      ok: true,
      value: await sendAssistantMessage(parsedTarget.data, {
        conversationId: parsedId.data,
        text: parsedText.data,
        locale: await getLocale(),
      }),
    }
  } catch (cause) {
    if (cause instanceof ApiError && cause.status === 429) {
      return failure(t('limit'))
    }
    console.error(cause instanceof ApiError ? `${String(cause.status)} ${cause.code}` : cause)
    return failure(t('failed'))
  }
}

export async function removeConversation(id: string): Promise<ActionResult<null>> {
  const t = await getTranslations('assistant.errors')
  const parsed = idSchema.safeParse(id)
  if (!parsed.success) {
    return failure(t('delete'))
  }
  return attempt(async () => {
    await deleteAssistantConversation(parsed.data)
    return null
  }, t('delete'))
}

export async function allowAssistant(journal: boolean): Promise<ActionResult<null>> {
  const t = await getTranslations('assistant.errors')
  const parsed = z.boolean().safeParse(journal)
  if (!parsed.success) {
    return failure(t('consent'))
  }
  return attempt(async () => {
    await grantConsents({
      kinds: parsed.data ? ['assistant_data', 'assistant_journal'] : ['assistant_data'],
    })
    return null
  }, t('consent'))
}
