import type { MemoryKind, MemoryOrigin, MemorySourceKind, MemoryStatus } from '@mycogni/domain'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  assistantMemories,
  assistantMemorySources,
  assistantMessages,
  checkInAddenda,
  checkIns,
  journalEntries,
} from '../../db/schema/index.ts'

export interface MemorySourceRecord {
  kind: MemorySourceKind
  at: Date
}

export interface MemoryRecord {
  id: string
  content: string
  kind: MemoryKind
  origin: MemoryOrigin
  importance: number
  status: MemoryStatus
  createdAt: Date
  updatedAt: Date
  sources: MemorySourceRecord[]
}

export interface ManualMemory {
  content: string
  kind: MemoryKind
  importance: number
}

export interface MemoryChanges {
  content?: string
  kind?: MemoryKind
}

export interface MemoryRepository {
  list(userId: string): Promise<MemoryRecord[]>
  create(userId: string, memory: ManualMemory): Promise<MemoryRecord>
  update(userId: string, id: string, changes: MemoryChanges): Promise<MemoryRecord | undefined>
  remove(userId: string, id: string): Promise<boolean>
  removeAll(userId: string): Promise<number>
}

const memoryColumns = {
  id: assistantMemories.id,
  content: assistantMemories.content,
  kind: assistantMemories.kind,
  origin: assistantMemories.origin,
  importance: assistantMemories.importance,
  status: assistantMemories.status,
  createdAt: assistantMemories.createdAt,
  updatedAt: assistantMemories.updatedAt,
}

const sourceKind = sql<MemorySourceKind>`case
  when ${assistantMemorySources.checkInId} is not null then 'check_in'
  when ${assistantMemorySources.checkInAddendumId} is not null then 'addendum'
  when ${assistantMemorySources.journalEntryId} is not null then 'journal'
  else 'conversation'
end`

const sourceAt =
  sql`coalesce(${checkIns.recordedAt}, ${checkInAddenda.createdAt}, ${journalEntries.createdAt}, ${assistantMessages.createdAt}, ${assistantMemorySources.createdAt})`.mapWith(
    assistantMemorySources.createdAt,
  )

async function sourcesOf(
  tx: Transaction,
  memoryIds: readonly string[],
): Promise<Map<string, MemorySourceRecord[]>> {
  const bySource = new Map<string, MemorySourceRecord[]>()
  if (memoryIds.length === 0) {
    return bySource
  }
  const rows = await tx
    .select({ memoryId: assistantMemorySources.memoryId, kind: sourceKind, at: sourceAt })
    .from(assistantMemorySources)
    .leftJoin(checkIns, eq(checkIns.id, assistantMemorySources.checkInId))
    .leftJoin(checkInAddenda, eq(checkInAddenda.id, assistantMemorySources.checkInAddendumId))
    .leftJoin(journalEntries, eq(journalEntries.id, assistantMemorySources.journalEntryId))
    .leftJoin(
      assistantMessages,
      eq(assistantMessages.id, assistantMemorySources.assistantMessageId),
    )
    .where(inArray(assistantMemorySources.memoryId, [...memoryIds]))
    .orderBy(asc(sourceAt))
  for (const { memoryId, kind, at } of rows) {
    bySource.set(memoryId, [...(bySource.get(memoryId) ?? []), { kind, at }])
  }
  return bySource
}

async function withSources(
  tx: Transaction,
  rows: Omit<MemoryRecord, 'sources'>[],
): Promise<MemoryRecord[]> {
  const sources = await sourcesOf(
    tx,
    rows.map((row) => row.id),
  )
  return rows.map((row) => ({ ...row, sources: sources.get(row.id) ?? [] }))
}

export async function memoriesOf(tx: Transaction, userId: string): Promise<MemoryRecord[]> {
  const rows = await tx
    .select(memoryColumns)
    .from(assistantMemories)
    .where(eq(assistantMemories.userId, userId))
    .orderBy(desc(assistantMemories.createdAt))
  return withSources(tx, rows)
}

export function createMemoryRepository(db: Database): MemoryRepository {
  return {
    list(userId) {
      return withUser(db, userId, (tx) => memoriesOf(tx, userId))
    },
    create(userId, memory) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(assistantMemories)
          .values({ userId, ...memory, origin: 'manual' })
          .returning(memoryColumns)
        if (row === undefined) {
          throw new Error('The memory was not stored')
        }
        return { ...row, sources: [] }
      })
    },
    update(userId, id, changes) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .update(assistantMemories)
          .set(changes)
          .where(and(eq(assistantMemories.id, id), eq(assistantMemories.userId, userId)))
          .returning(memoryColumns)
        const [updated] = await withSources(tx, rows)
        return updated
      })
    },
    remove(userId, id) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .delete(assistantMemories)
          .where(and(eq(assistantMemories.id, id), eq(assistantMemories.userId, userId)))
          .returning({ id: assistantMemories.id })
        return rows.length > 0
      })
    },
    removeAll(userId) {
      return withUser(db, userId, async (tx) => {
        const rows = await tx
          .delete(assistantMemories)
          .where(eq(assistantMemories.userId, userId))
          .returning({ id: assistantMemories.id })
        return rows.length
      })
    },
  }
}
