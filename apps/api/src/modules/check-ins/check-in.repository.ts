import { and, count, desc, eq, gte, ilike, isNotNull, isNull, lt, lte, or, sql } from 'drizzle-orm'
import type { Database } from '../../db/client.ts'
import { withUser } from '../../db/rls.ts'
import { checkIns } from '../../db/schema/index.ts'

export interface CheckInRecord {
  id: string
  moodLevel: number
  emotions: string[]
  contexts: string[]
  note: string | null
  recordedAt: Date
}

export interface OwnedCheckInRecord extends CheckInRecord {
  userId: string
}

export type NewCheckIn = Omit<CheckInRecord, 'id' | 'recordedAt'>

export interface CheckInFilter {
  since?: Date
  q?: string
  qTags?: readonly string[]
  tags?: readonly string[]
  minMood?: number
  maxMood?: number
  hasNote?: boolean
}

export interface CheckInWindow extends CheckInFilter {
  before?: Date
  limit: number
}

export interface CheckInRepository {
  create(userId: string, checkIn: NewCheckIn): Promise<CheckInRecord>
  list(viewerId: string, ownerId: string, window: CheckInWindow): Promise<CheckInRecord[]>
  count(userId: string, filter: CheckInFilter): Promise<number>
  find(viewerId: string, id: string): Promise<OwnedCheckInRecord | null>
}

const columns = {
  id: checkIns.id,
  moodLevel: checkIns.moodLevel,
  emotions: checkIns.emotions,
  contexts: checkIns.contexts,
  note: checkIns.note,
  recordedAt: checkIns.recordedAt,
}

const allTags = sql`(${checkIns.emotions} || ${checkIns.contexts})`

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`)
}

function searchOf(q: string | undefined, qTags: readonly string[] | undefined) {
  if (q === undefined || q === '') {
    return undefined
  }
  const pattern = `%${escapeLike(q)}%`
  return or(
    ilike(checkIns.note, pattern),
    sql`exists (select 1 from unnest(${allTags}) as tag where tag ilike ${pattern})`,
    qTags === undefined || qTags.length === 0
      ? undefined
      : sql`${allTags} && ${sql.param(qTags)}::text[]`,
  )
}

function noteOf(hasNote: boolean | undefined) {
  if (hasNote === undefined) {
    return undefined
  }
  return hasNote ? isNotNull(checkIns.note) : isNull(checkIns.note)
}

function conditionsOf(ownerId: string, filter: Omit<CheckInWindow, 'limit'>) {
  const { since, before, q, qTags, tags, minMood, maxMood, hasNote } = filter
  return and(
    eq(checkIns.userId, ownerId),
    since === undefined ? undefined : gte(checkIns.recordedAt, since),
    before === undefined ? undefined : lt(checkIns.recordedAt, before),
    searchOf(q, qTags),
    tags === undefined || tags.length === 0
      ? undefined
      : sql`${allTags} @> ${sql.param(tags)}::text[]`,
    minMood === undefined ? undefined : gte(checkIns.moodLevel, minMood),
    maxMood === undefined ? undefined : lte(checkIns.moodLevel, maxMood),
    noteOf(hasNote),
  )
}

export function createCheckInRepository(db: Database): CheckInRepository {
  return {
    create(userId, checkIn) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .insert(checkIns)
          .values({ ...checkIn, userId })
          .returning(columns)
        if (row === undefined) {
          throw new Error('Check-in was not saved')
        }
        return row
      })
    },
    list(viewerId, ownerId, { limit, ...filter }) {
      return withUser(db, viewerId, (tx) =>
        tx
          .select(columns)
          .from(checkIns)
          .where(conditionsOf(ownerId, filter))
          .orderBy(desc(checkIns.recordedAt))
          .limit(limit),
      )
    },
    count(userId, filter) {
      return withUser(db, userId, async (tx) => {
        const [row] = await tx
          .select({ total: count() })
          .from(checkIns)
          .where(conditionsOf(userId, filter))
        return row?.total ?? 0
      })
    },
    find(viewerId, id) {
      return withUser(db, viewerId, async (tx) => {
        const [row] = await tx
          .select({ ...columns, userId: checkIns.userId })
          .from(checkIns)
          .where(eq(checkIns.id, id))
        return row ?? null
      })
    },
  }
}
