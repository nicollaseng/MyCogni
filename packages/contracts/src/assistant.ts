import {
  assistantLimits,
  assistantModes,
  assistantRoles,
  locales,
  riskLevels,
} from '@mycogni/domain'
import { z } from 'zod'

const timestamp = z.iso.datetime({ offset: true })

export const riskLevelSchema = z.enum(riskLevels)

export const sendAssistantMessageSchema = z.object({
  conversationId: z.uuid().nullable(),
  text: z.string().trim().min(1).max(assistantLimits.messageLength),
  locale: z.enum(locales),
})

export type SendAssistantMessageInput = z.infer<typeof sendAssistantMessageSchema>

export const assistantMessageSchema = z.object({
  id: z.uuid(),
  role: z.enum(assistantRoles),
  text: z.string(),
  risk: riskLevelSchema,
  createdAt: timestamp,
})

export type AssistantMessage = z.infer<typeof assistantMessageSchema>

export const assistantConversationSummarySchema = z.object({
  id: z.uuid(),
  mode: z.enum(assistantModes),
  risk: riskLevelSchema,
  preview: z.string(),
  createdAt: timestamp,
  updatedAt: timestamp,
})

export type AssistantConversationSummary = z.infer<typeof assistantConversationSummarySchema>

export const assistantConversationSchema = assistantConversationSummarySchema.extend({
  messages: z.array(assistantMessageSchema),
})

export type AssistantConversation = z.infer<typeof assistantConversationSchema>

export const assistantAccessSchema = z.object({
  records: z.boolean(),
  journal: z.boolean(),
})

export type AssistantAccess = z.infer<typeof assistantAccessSchema>

export const assistantOverviewSchema = z.object({
  access: assistantAccessSchema,
  conversations: z.array(assistantConversationSummarySchema),
})

export type AssistantOverview = z.infer<typeof assistantOverviewSchema>

export const assistantExchangeSchema = z.object({
  conversationId: z.uuid(),
  messages: z.array(assistantMessageSchema),
  risk: riskLevelSchema,
})

export type AssistantExchange = z.infer<typeof assistantExchangeSchema>
