import type { AssistantMode, AssistantRole, RiskLevel } from '@mycogni/domain'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { assistantConversations, assistantMessages, profiles } from '../../db/schema/index.ts'

export type AssistantScope = { mode: 'personal' } | { mode: 'professional'; patientId: string }

export interface ConversationRecord {
  id: string
  mode: AssistantMode
  patientId: string | null
  journalEntryId: string | null
  risk: RiskLevel
  preview: string
  createdAt: Date
  updatedAt: Date
}

export interface MessageRecord {
  id: string
  role: AssistantRole
  content: string
  risk: RiskLevel
  createdAt: Date
}

export interface NewMessage {
  role: AssistantRole
  content: string
  risk: RiskLevel
}

export interface AssistantRepository {
  list(ownerId: string, scope: AssistantScope, limit: number): Promise<ConversationRecord[]>
  find(ownerId: string, id: string): Promise<ConversationRecord | undefined>
  create(
    ownerId: string,
    scope: AssistantScope,
    journalEntryId: string | null,
  ): Promise<ConversationRecord>
  messages(ownerId: string, conversationId: string, limit: number): Promise<MessageRecord[]>
  append(
    ownerId: string,
    conversationId: string,
    messages: readonly NewMessage[],
    risk: RiskLevel,
  ): Promise<MessageRecord[]>
  remove(ownerId: string, id: string): Promise<boolean>
  timeZoneOf(viewerId: string, ownerId: string): Promise<string>
}

const previewLength = 80

const conversationColumns = {
  id: assistantConversations.id,
  mode: assistantConversations.mode,
  patientId: assistantConversations.patientId,
  journalEntryId: assistantConversations.journalEntryId,
  risk: assistantConversations.risk,
  preview: sql<string>`coalesce((
    select left(m.content, ${previewLength}) from public.assistant_messages m
    where m.conversation_id = assistant_conversations.id and m.role = 'user'
    order by m.created_at asc limit 1
  ), '')`,
  createdAt: assistantConversations.createdAt,
  updatedAt: assistantConversations.updatedAt,
}

const messageColumns = {
  id: assistantMessages.id,
  role: assistantMessages.role,
  content: assistantMessages.content,
  risk: assistantMessages.risk,
  createdAt: assistantMessages.createdAt,
}

function scopeCondition(scope: AssistantScope) {
  return scope.mode === 'personal'
    ? and(eq(assistantConversations.mode, 'personal'), isNull(assistantConversations.patientId))
    : and(
        eq(assistantConversations.mode, 'professional'),
        eq(assistantConversations.patientId, scope.patientId),
      )
}

export function createAssistantRepository(db: Database): AssistantRepository {
  return {
    list(ownerId, scope, limit) {
      return withUser(db, ownerId, (tx) =>
        tx
          .select(conversationColumns)
          .from(assistantConversations)
          .where(and(eq(assistantConversations.ownerId, ownerId), scopeCondition(scope)))
          .orderBy(desc(assistantConversations.updatedAt))
          .limit(limit),
      )
    },
    find(ownerId, id) {
      return withUser(db, ownerId, async (tx) => {
        const [row] = await tx
          .select(conversationColumns)
          .from(assistantConversations)
          .where(
            and(eq(assistantConversations.id, id), eq(assistantConversations.ownerId, ownerId)),
          )
        return row
      })
    },
    create(ownerId, scope, journalEntryId) {
      return withUser(db, ownerId, async (tx) => {
        const [row] = await tx
          .insert(assistantConversations)
          .values({
            ownerId,
            mode: scope.mode,
            patientId: scope.mode === 'personal' ? null : scope.patientId,
            journalEntryId,
          })
          .returning({
            id: assistantConversations.id,
            mode: assistantConversations.mode,
            patientId: assistantConversations.patientId,
            journalEntryId: assistantConversations.journalEntryId,
            risk: assistantConversations.risk,
            createdAt: assistantConversations.createdAt,
            updatedAt: assistantConversations.updatedAt,
          })
        if (row === undefined) {
          throw new Error('Conversation was not created')
        }
        return { ...row, preview: '' }
      })
    },
    messages(ownerId, conversationId, limit) {
      return withUser(db, ownerId, async (tx) => {
        const rows = await tx
          .select(messageColumns)
          .from(assistantMessages)
          .where(
            and(
              eq(assistantMessages.conversationId, conversationId),
              eq(assistantMessages.ownerId, ownerId),
            ),
          )
          .orderBy(desc(assistantMessages.createdAt), desc(assistantMessages.id))
          .limit(limit)
        return rows.reverse()
      })
    },
    append(ownerId, conversationId, messages, risk) {
      return withUser(db, ownerId, async (tx) => {
        const start = Date.now()
        const rows = await tx
          .insert(assistantMessages)
          .values(
            messages.map((message, index) => ({
              ...message,
              conversationId,
              ownerId,
              createdAt: new Date(start + index),
            })),
          )
          .returning(messageColumns)
        await tx
          .update(assistantConversations)
          .set({
            risk: sql`greatest(${assistantConversations.risk}, ${risk}::public.assistant_risk)`,
            updatedAt: sql`now()`,
          })
          .where(eq(assistantConversations.id, conversationId))
        return [...rows].sort(
          (first, second) => first.createdAt.getTime() - second.createdAt.getTime(),
        )
      })
    },
    remove(ownerId, id) {
      return withUser(db, ownerId, async (tx) => {
        const rows = await tx
          .delete(assistantConversations)
          .where(
            and(eq(assistantConversations.id, id), eq(assistantConversations.ownerId, ownerId)),
          )
          .returning({ id: assistantConversations.id })
        return rows.length > 0
      })
    },
    timeZoneOf(viewerId, ownerId) {
      return withUser(db, viewerId, async (tx) => {
        const [row] = await tx
          .select({ timezone: profiles.timezone })
          .from(profiles)
          .where(eq(profiles.id, ownerId))
        return row?.timezone ?? 'America/Sao_Paulo'
      })
    },
  }
}
