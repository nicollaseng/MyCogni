import {
  consentVersion,
  type MemoryImportance,
  type MemoryKind,
  type MemoryOrigin,
  type MemorySourceKind,
} from '@mycogni/domain'
import { and, asc, desc, eq, isNull, lt, ne, or, sql, type Column } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  assistantConversations,
  assistantMemories,
  assistantMemorySources,
  assistantMessages,
  checkInAddenda,
  checkIns,
  journalEntries,
  profiles,
} from '../../db/schema/index.ts'

export interface ExtractionSettings {
  enabled: boolean
  readUntil: Date | null
  locale: string | null
  timezone: string
  journal: boolean
}

export interface SourceItem {
  kind: MemorySourceKind
  id: string
  at: Date
  text: string
}

export interface StoredMemory {
  id: string
  content: string
  kind: MemoryKind
  origin: MemoryOrigin
}

export interface ItemQuery {
  since: Date
  journal: boolean
  limit: number
}

export interface SourceLink {
  kind: MemorySourceKind
  id: string
}

export type ResolvedChange =
  | {
      change: 'add'
      content: string
      kind: MemoryKind
      importance: MemoryImportance
      sources: SourceLink[]
    }
  | {
      change: 'update'
      id: string
      content: string
      importance: MemoryImportance
      sources: SourceLink[]
    }
  | { change: 'link'; id: string; sources: SourceLink[] }
  | { change: 'archive'; id: string }

export interface MemoryExtractionRepository {
  settings(userId: string): Promise<ExtractionSettings | undefined>
  items(userId: string, query: ItemQuery): Promise<SourceItem[]>
  memories(userId: string, limit: number): Promise<StoredMemory[]>
  apply(userId: string, changes: readonly ResolvedChange[], readUntil: Date): Promise<void>
}

function after(column: Column, moment: Date) {
  return sql`date_trunc('milliseconds', ${column}) > ${moment.toISOString()}::timestamptz`
}

const sourceColumn = {
  check_in: 'checkInId',
  addendum: 'checkInAddendumId',
  journal: 'journalEntryId',
  conversation: 'assistantMessageId',
} as const satisfies Record<MemorySourceKind, keyof typeof assistantMemorySources.$inferInsert>

async function link(
  tx: Transaction,
  userId: string,
  memoryId: string,
  sources: readonly SourceLink[],
): Promise<void> {
  if (sources.length === 0) {
    return
  }
  await tx
    .insert(assistantMemorySources)
    .values(sources.map((source) => ({ memoryId, userId, [sourceColumn[source.kind]]: source.id })))
    .onConflictDoNothing()
}

const learned = (userId: string, id: string) =>
  and(
    eq(assistantMemories.id, id),
    eq(assistantMemories.userId, userId),
    eq(assistantMemories.origin, 'extracted'),
    eq(assistantMemories.status, 'active'),
  )

async function applyChange(tx: Transaction, userId: string, change: ResolvedChange) {
  switch (change.change) {
    case 'add': {
      const [row] = await tx
        .insert(assistantMemories)
        .values({
          userId,
          content: change.content,
          kind: change.kind,
          importance: change.importance,
          origin: 'extracted',
        })
        .returning({ id: assistantMemories.id })
      if (row !== undefined) {
        await link(tx, userId, row.id, change.sources)
      }
      return
    }
    case 'update': {
      const rows = await tx
        .update(assistantMemories)
        .set({ content: change.content, importance: change.importance })
        .where(learned(userId, change.id))
        .returning({ id: assistantMemories.id })
      if (rows.length > 0) {
        await link(tx, userId, change.id, change.sources)
      }
      return
    }
    case 'link':
      await link(tx, userId, change.id, change.sources)
      return
    case 'archive':
      await tx
        .update(assistantMemories)
        .set({ status: 'archived' })
        .where(learned(userId, change.id))
  }
}

export function createMemoryExtractionRepository(db: Database): MemoryExtractionRepository {
  return {
    settings(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({
            enabled: profiles.memoriesEnabled,
            readUntil: profiles.memoriesReadUntil,
            locale: profiles.locale,
            timezone: profiles.timezone,
            journal: sql<boolean>`exists (
              select 1 from public.consents c
              where c.user_id = ${userId}
                and c.kind = 'assistant_journal'
                and c.version = ${consentVersion}
                and c.revoked_at is null
            )`,
          })
          .from(profiles)
          .where(eq(profiles.id, userId))
        return row
      })
    },
    items(userId, { since, journal, limit }) {
      return withUser(db, userId, async (tx) => {
        const notes = await tx
          .select({ id: checkIns.id, at: checkIns.recordedAt, text: checkIns.note })
          .from(checkIns)
          .where(
            and(
              eq(checkIns.userId, userId),
              after(checkIns.recordedAt, since),
              ne(checkIns.note, ''),
            ),
          )
          .orderBy(asc(checkIns.recordedAt))
          .limit(limit)
        const addenda = await tx
          .select({
            id: checkInAddenda.id,
            at: checkInAddenda.createdAt,
            text: checkInAddenda.text,
          })
          .from(checkInAddenda)
          .where(and(eq(checkInAddenda.userId, userId), after(checkInAddenda.createdAt, since)))
          .orderBy(asc(checkInAddenda.createdAt))
          .limit(limit)
        const pages = journal
          ? await tx
              .select({
                id: journalEntries.id,
                at: journalEntries.updatedAt,
                title: journalEntries.title,
                text: journalEntries.plainText,
              })
              .from(journalEntries)
              .where(
                and(
                  eq(journalEntries.userId, userId),
                  after(journalEntries.updatedAt, since),
                  ne(journalEntries.plainText, ''),
                ),
              )
              .orderBy(asc(journalEntries.updatedAt))
              .limit(limit)
          : []
        const messages = await tx
          .select({
            id: assistantMessages.id,
            at: assistantMessages.createdAt,
            text: assistantMessages.content,
          })
          .from(assistantMessages)
          .innerJoin(
            assistantConversations,
            eq(assistantConversations.id, assistantMessages.conversationId),
          )
          .where(
            and(
              eq(assistantMessages.ownerId, userId),
              eq(assistantMessages.role, 'user'),
              eq(assistantConversations.mode, 'personal'),
              after(assistantMessages.createdAt, since),
            ),
          )
          .orderBy(asc(assistantMessages.createdAt))
          .limit(limit)
        return [
          ...notes.flatMap((row) =>
            row.text === null ? [] : [{ kind: 'check_in' as const, ...row, text: row.text }],
          ),
          ...addenda.map((row) => ({ kind: 'addendum' as const, ...row })),
          ...pages.map(({ title, ...row }) => ({
            kind: 'journal' as const,
            ...row,
            text: title === null ? row.text : `${title}\n${row.text}`,
          })),
          ...messages.map((row) => ({ kind: 'conversation' as const, ...row })),
        ]
          .sort((first, second) => first.at.getTime() - second.at.getTime())
          .slice(0, limit)
      })
    },
    memories(userId, limit) {
      return withUser(db, userId, (tx) =>
        tx
          .select({
            id: assistantMemories.id,
            content: assistantMemories.content,
            kind: assistantMemories.kind,
            origin: assistantMemories.origin,
          })
          .from(assistantMemories)
          .where(and(eq(assistantMemories.userId, userId), eq(assistantMemories.status, 'active')))
          .orderBy(desc(assistantMemories.importance), desc(assistantMemories.updatedAt))
          .limit(limit),
      )
    },
    apply(userId, changes, readUntil) {
      return withUser(db, userId, async (tx) => {
        for (const change of changes) {
          await applyChange(tx, userId, change)
        }
        await tx
          .update(profiles)
          .set({ memoriesReadUntil: readUntil })
          .where(
            and(
              eq(profiles.id, userId),
              or(isNull(profiles.memoriesReadUntil), lt(profiles.memoriesReadUntil, readUntil)),
            ),
          )
      })
    },
  }
}
