import { isActiveExport, type DataExportStatus } from '@mycogni/domain'
import { and, desc, eq, inArray, lte, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { dataExports } from '../../db/schema/index.ts'

export interface DataExportRecord {
  id: string
  userId: string
  status: DataExportStatus
  requestedAt: Date
  startedAt: Date | null
  readyAt: Date | null
  expiresAt: Date | null
  storagePath: string | null
  sizeBytes: number | null
}

export interface ReadyExport {
  storagePath: string
  sizeBytes: number
  readyAt: Date
  expiresAt: Date
}

export interface DataExportRepository {
  latest(userId: string): Promise<DataExportRecord | undefined>
  find(userId: string, id: string): Promise<DataExportRecord | undefined>
  request(userId: string): Promise<{ record: DataExportRecord; created: boolean }>
  start(id: string): Promise<DataExportRecord | undefined>
  finish(id: string, ready: ReadyExport): Promise<void>
  fail(id: string, error: string): Promise<DataExportRecord | undefined>
  expiring(now: Date): Promise<DataExportRecord[]>
  expire(id: string): Promise<void>
  stalled(before: Date): Promise<DataExportRecord[]>
}

const columns = {
  id: dataExports.id,
  userId: dataExports.userId,
  status: dataExports.status,
  requestedAt: dataExports.requestedAt,
  startedAt: dataExports.startedAt,
  readyAt: dataExports.readyAt,
  expiresAt: dataExports.expiresAt,
  storagePath: dataExports.storagePath,
  sizeBytes: dataExports.sizeBytes,
}

const active = inArray(dataExports.status, ['queued', 'running'])

export function createDataExportRepository(db: Database): DataExportRepository {
  async function activeOf(userId: string): Promise<DataExportRecord | undefined> {
    const [row] = await db
      .select(columns)
      .from(dataExports)
      .where(and(eq(dataExports.userId, userId), active))
    return row
  }

  return {
    latest(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select(columns)
          .from(dataExports)
          .where(eq(dataExports.userId, userId))
          .orderBy(desc(dataExports.requestedAt))
          .limit(1)
        return row
      })
    },
    find(userId, id) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select(columns)
          .from(dataExports)
          .where(and(eq(dataExports.id, id), eq(dataExports.userId, userId)))
        return row
      })
    },
    async request(userId) {
      const existing = await activeOf(userId)
      if (existing !== undefined) {
        return { record: existing, created: false }
      }
      const [row] = await db
        .insert(dataExports)
        .values({ userId })
        .onConflictDoNothing()
        .returning(columns)
      if (row !== undefined) {
        return { record: row, created: true }
      }
      const raced = await activeOf(userId)
      if (raced === undefined || !isActiveExport(raced.status)) {
        throw new Error('The export request was not stored')
      }
      return { record: raced, created: false }
    },
    async start(id) {
      const [row] = await db
        .update(dataExports)
        .set({ status: 'running', startedAt: sql`now()` })
        .where(and(eq(dataExports.id, id), eq(dataExports.status, 'queued')))
        .returning(columns)
      return row
    },
    async finish(id, ready) {
      await db
        .update(dataExports)
        .set({ status: 'ready', ...ready, error: null })
        .where(eq(dataExports.id, id))
    },
    async fail(id, error) {
      const [row] = await db
        .update(dataExports)
        .set({ status: 'failed', error: error.slice(0, 500) })
        .where(and(eq(dataExports.id, id), active))
        .returning(columns)
      return row
    },
    expiring(now) {
      return db
        .select(columns)
        .from(dataExports)
        .where(and(eq(dataExports.status, 'ready'), lte(dataExports.expiresAt, now)))
    },
    async expire(id) {
      await db
        .update(dataExports)
        .set({ status: 'expired', storagePath: null })
        .where(eq(dataExports.id, id))
    },
    stalled(before) {
      return db
        .select(columns)
        .from(dataExports)
        .where(and(active, lte(dataExports.requestedAt, before)))
    },
  }
}
