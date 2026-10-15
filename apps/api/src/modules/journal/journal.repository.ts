import type { JournalNode } from '@mycogni/contracts'
import type { JournalShareScope, ProfessionalKind } from '@mycogni/domain'
import { and, desc, eq, ilike, inArray, isNull, lt, max, or, sql } from 'drizzle-orm'
import type { Database, Transaction } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import {
  careLinks,
  journalAccessLog,
  journalEntries,
  journalShareEntries,
  journalShares,
  professionalProfiles,
} from '../../db/schema/index.ts'

export interface JournalEntrySummaryRecord {
  id: string
  title: string | null
  preview: string
  imageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface JournalEntryRecord {
  id: string
  userId: string
  title: string | null
  body: JournalNode
  plainText: string
  imagePaths: string[]
  createdAt: Date
  updatedAt: Date
}

export interface JournalChanges {
  title: string | null
  body: JournalNode
  plainText: string
  imagePaths: string[]
}

export interface JournalSearch {
  q?: string
  before?: Date
  limit: number
}

export interface JournalShareRecord {
  id: string
  careLinkId: string
  professional: { name: string; kind: ProfessionalKind }
  scope: JournalShareScope
  entryIds: string[]
  expiresAt: Date | null
  revokedAt: Date | null
  createdAt: Date
  lastAccessAt: Date | null
}

export interface NewJournalShare {
  careLinkId: string
  scope: JournalShareScope
  entryIds: string[]
  expiresAt: Date | null
}

export interface JournalAccessRecord {
  entryId: string
  entryTitle: string | null
  accessedAt: Date
}

export type UpdateOutcome =
  { kind: 'updated'; entry: JournalEntryRecord; removedImages: string[] } | { kind: 'not_found' }

export interface JournalRepository {
  list(
    viewerId: string,
    ownerId: string,
    search: JournalSearch,
  ): Promise<JournalEntrySummaryRecord[]>
  create(userId: string): Promise<JournalEntryRecord>
  find(viewerId: string, entryId: string): Promise<JournalEntryRecord | undefined>
  update(userId: string, entryId: string, changes: JournalChanges): Promise<UpdateOutcome>
  delete(userId: string, entryId: string): Promise<string[] | null>
  listShares(patientId: string): Promise<JournalShareRecord[]>
  createShare(patientId: string, share: NewJournalShare): Promise<string | null>
  revokeShare(patientId: string, shareId: string): Promise<boolean>
  accessLog(patientId: string, shareId: string): Promise<JournalAccessRecord[]>
  recordAccess(professionalId: string, patientId: string, entryId: string): Promise<void>
}

const summaryColumns = {
  id: journalEntries.id,
  title: journalEntries.title,
  preview: sql<string>`left(${journalEntries.plainText}, 400)`,
  imageCount: sql<number>`cardinality(${journalEntries.imagePaths})`.mapWith(Number),
  createdAt: journalEntries.createdAt,
  updatedAt: journalEntries.updatedAt,
}

const entryColumns = {
  id: journalEntries.id,
  userId: journalEntries.userId,
  title: journalEntries.title,
  body: sql<JournalNode>`${journalEntries.body}`,
  plainText: journalEntries.plainText,
  imagePaths: journalEntries.imagePaths,
  createdAt: journalEntries.createdAt,
  updatedAt: journalEntries.updatedAt,
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

const activeShare = and(
  isNull(journalShares.revokedAt),
  or(isNull(journalShares.expiresAt), sql`${journalShares.expiresAt} > now()`),
)

async function sharesOf(tx: Transaction, patientId: string): Promise<JournalShareRecord[]> {
  const rows = await tx
    .select({
      id: journalShares.id,
      careLinkId: journalShares.careLinkId,
      professional: { name: professionalProfiles.fullName, kind: professionalProfiles.kind },
      scope: journalShares.scope,
      expiresAt: journalShares.expiresAt,
      revokedAt: journalShares.revokedAt,
      createdAt: journalShares.createdAt,
    })
    .from(journalShares)
    .innerJoin(professionalProfiles, eq(professionalProfiles.userId, journalShares.professionalId))
    .where(eq(journalShares.patientId, patientId))
    .orderBy(desc(journalShares.createdAt))
  const ids = rows.map((row) => row.id)
  if (ids.length === 0) {
    return []
  }
  const [entries, accesses] = await Promise.all([
    tx
      .select({ shareId: journalShareEntries.shareId, entryId: journalShareEntries.entryId })
      .from(journalShareEntries)
      .where(inArray(journalShareEntries.shareId, ids)),
    tx
      .select({ shareId: journalAccessLog.shareId, last: max(journalAccessLog.accessedAt) })
      .from(journalAccessLog)
      .where(inArray(journalAccessLog.shareId, ids))
      .groupBy(journalAccessLog.shareId),
  ])
  return rows.map((row) => ({
    ...row,
    entryIds: entries.filter((entry) => entry.shareId === row.id).map((entry) => entry.entryId),
    lastAccessAt: accesses.find((access) => access.shareId === row.id)?.last ?? null,
  }))
}

export function createJournalRepository(db: Database): JournalRepository {
  return {
    list(viewerId, ownerId, { q, before, limit }) {
      const pattern = q === undefined || q === '' ? undefined : `%${escapeLike(q)}%`
      return withUser(db, viewerId, (tx) =>
        tx
          .select(summaryColumns)
          .from(journalEntries)
          .where(
            and(
              eq(journalEntries.userId, ownerId),
              pattern === undefined
                ? undefined
                : or(
                    ilike(journalEntries.title, pattern),
                    ilike(journalEntries.plainText, pattern),
                  ),
              before === undefined ? undefined : lt(journalEntries.updatedAt, before),
            ),
          )
          .orderBy(desc(journalEntries.updatedAt))
          .limit(limit),
      )
    },
    create(userId) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx.insert(journalEntries).values({ userId }).returning(entryColumns)
        if (row === undefined) {
          throw new Error('Journal entry was not created')
        }
        return row
      })
    },
    find(viewerId, entryId) {
      return withUser(db, viewerId, async (tx) => {
        const [row] = await tx
          .select(entryColumns)
          .from(journalEntries)
          .where(eq(journalEntries.id, entryId))
        return row
      })
    },
    update(userId, entryId, changes) {
      return withUser(db, userId, async (tx): Promise<UpdateOutcome> => {
        const [previous] = await tx
          .select({ imagePaths: journalEntries.imagePaths })
          .from(journalEntries)
          .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
          .for('update')
        if (previous === undefined) {
          return { kind: 'not_found' }
        }
        const [entry] = await tx
          .update(journalEntries)
          .set({ ...changes, updatedAt: new Date() })
          .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
          .returning(entryColumns)
        if (entry === undefined) {
          return { kind: 'not_found' }
        }
        return {
          kind: 'updated',
          entry,
          removedImages: previous.imagePaths.filter((path) => !changes.imagePaths.includes(path)),
        }
      })
    },
    delete(userId, entryId) {
      return withUser(db, userId, async (tx) => {
        const [deleted] = await tx
          .delete(journalEntries)
          .where(and(eq(journalEntries.id, entryId), eq(journalEntries.userId, userId)))
          .returning({ imagePaths: journalEntries.imagePaths })
        return deleted === undefined ? null : deleted.imagePaths
      })
    },
    listShares(patientId) {
      return withUser(db, patientId, (tx) => sharesOf(tx, patientId))
    },
    createShare(patientId, share) {
      return withUser(db, patientId, async (tx) => {
        const [link] = await tx
          .select({ professionalId: careLinks.professionalId })
          .from(careLinks)
          .where(
            and(
              eq(careLinks.id, share.careLinkId),
              eq(careLinks.patientId, patientId),
              isNull(careLinks.endedAt),
            ),
          )
        if (link === undefined) {
          return null
        }
        const [created] = await tx
          .insert(journalShares)
          .values({
            patientId,
            professionalId: link.professionalId,
            careLinkId: share.careLinkId,
            scope: share.scope,
            expiresAt: share.expiresAt,
          })
          .returning({ id: journalShares.id })
        if (created === undefined) {
          throw new Error('Journal share was not created')
        }
        if (share.scope === 'entries') {
          const owned = await tx
            .select({ id: journalEntries.id })
            .from(journalEntries)
            .where(
              and(eq(journalEntries.userId, patientId), inArray(journalEntries.id, share.entryIds)),
            )
          if (owned.length !== new Set(share.entryIds).size) {
            throw new UnknownJournalEntryError()
          }
          await tx
            .insert(journalShareEntries)
            .values(owned.map((entry) => ({ shareId: created.id, entryId: entry.id })))
        }
        return created.id
      })
    },
    revokeShare(patientId, shareId) {
      return withUser(db, patientId, async (tx) => {
        const rows = await tx
          .update(journalShares)
          .set({ revokedAt: new Date() })
          .where(
            and(
              eq(journalShares.id, shareId),
              eq(journalShares.patientId, patientId),
              isNull(journalShares.revokedAt),
            ),
          )
          .returning({ id: journalShares.id })
        return rows.length > 0
      })
    },
    accessLog(patientId, shareId) {
      return withUser(db, patientId, (tx) =>
        tx
          .select({
            entryId: journalAccessLog.entryId,
            entryTitle: journalEntries.title,
            accessedAt: journalAccessLog.accessedAt,
          })
          .from(journalAccessLog)
          .innerJoin(journalShares, eq(journalShares.id, journalAccessLog.shareId))
          .innerJoin(journalEntries, eq(journalEntries.id, journalAccessLog.entryId))
          .where(and(eq(journalAccessLog.shareId, shareId), eq(journalShares.patientId, patientId)))
          .orderBy(desc(journalAccessLog.accessedAt))
          .limit(200),
      )
    },
    recordAccess(professionalId, patientId, entryId) {
      return withUser(db, professionalId, async (tx) => {
        const [share] = await tx
          .select({ id: journalShares.id })
          .from(journalShares)
          .where(
            and(
              eq(journalShares.professionalId, professionalId),
              eq(journalShares.patientId, patientId),
              activeShare,
              or(
                eq(journalShares.scope, 'all'),
                sql`exists (select 1 from public.journal_share_entries se where se.share_id = ${journalShares.id} and se.entry_id = ${entryId})`,
              ),
            ),
          )
          .orderBy(desc(journalShares.createdAt))
          .limit(1)
        if (share !== undefined) {
          await tx.insert(journalAccessLog).values({ shareId: share.id, entryId, professionalId })
        }
      })
    },
  }
}

export class UnknownJournalEntryError extends Error {
  constructor() {
    super('A shared entry does not belong to the patient')
    this.name = 'UnknownJournalEntryError'
  }
}
